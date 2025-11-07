# Dataverse customizations.xmlから選択肢列の値を抽出するスクリプト
# 使用方法: .\Extract-DataverseChoices.ps1 -XmlPath "C:\path\to\customizations.xml"

param(
    [Parameter(Mandatory=$true)]
    [string]$XmlPath,
    
    [Parameter(Mandatory=$false)]
    [string]$EntityName = ""
)

# XMLファイルの存在確認
if (-not (Test-Path $XmlPath)) {
    Write-Error "XMLファイルが見つかりません: $XmlPath"
    exit 1
}

Write-Host "`nDataverse Schema Extractor" -ForegroundColor Cyan
Write-Host "=========================`n" -ForegroundColor Cyan

# XMLを読み込み（UTF-8エンコーディング）
Write-Host "Reading XML file: $XmlPath" -ForegroundColor Yellow
try {
    $xmlContent = Get-Content -Path $XmlPath -Encoding UTF8 -Raw
    [xml]$xml = $xmlContent
    Write-Host "✓ XML loaded successfully`n" -ForegroundColor Green
}
catch {
    Write-Error "XMLの読み込みに失敗しました: $_"
    exit 1
}

# エンティティを取得
$entities = $xml.ImportExportXml.Entities.Entity

if (-not $entities) {
    Write-Error "エンティティが見つかりません"
    exit 1
}

Write-Host "Found $($entities.Count) entities in XML`n" -ForegroundColor Cyan

# エンティティ名が指定されていない場合は一覧表示
if ([string]::IsNullOrEmpty($EntityName)) {
    Write-Host "Available Entities:" -ForegroundColor Yellow
    foreach ($entity in $entities) {
        $name = $entity.EntityInfo.entity.Name
        $displayName = $entity.Name.LocalizedName
        Write-Host "  - $name ($displayName)" -ForegroundColor White
    }
    Write-Host "`nUsage: .\Extract-DataverseChoices.ps1 -XmlPath ""$XmlPath"" -EntityName ""entity_name""`n" -ForegroundColor Gray
    exit 0
}

# 指定されたエンティティを検索
foreach ($entity in $entities) {
    $entityLogicalName = $entity.EntityInfo.entity.Name
    
    if ($entityLogicalName -eq $EntityName) {
        $entityDisplayName = $entity.Name.LocalizedName
        Write-Host "=== Entity: $entityLogicalName ($entityDisplayName) ===" -ForegroundColor Green
        Write-Host ""
        
        # 属性を取得
        $attributes = $entity.EntityInfo.entity.attributes.attribute
        
        # Picklist属性のみをフィルター
        $picklistAttributes = $attributes | Where-Object { $_.Type -eq 'picklist' }
        
        if ($picklistAttributes.Count -eq 0) {
            Write-Host "No picklist attributes found in this entity." -ForegroundColor Gray
            exit 0
        }
        
        Write-Host "Found $($picklistAttributes.Count) picklist attribute(s):`n" -ForegroundColor Cyan
        
        # TypeScriptコード生成用の配列
        $tsMapping = @()
        
        foreach ($attr in $picklistAttributes) {
            $attrName = $attr.Name
            
            # 表示名を取得（日本語優先、なければ英語）
            $attrDisplayName = $attr.displaynames.displayname | Where-Object { $_.languagecode -eq '1041' } | Select-Object -ExpandProperty description
            if (-not $attrDisplayName) {
                $attrDisplayName = $attr.displaynames.displayname | Where-Object { $_.languagecode -eq '1033' } | Select-Object -ExpandProperty description
            }
            
            Write-Host "--- $attrName ($attrDisplayName) ---" -ForegroundColor Yellow
            
            # optionset要素を取得
            if ($attr.optionset) {
                $options = $attr.optionset.options.option
                
                if ($options) {
                    $choiceValues = @()
                    
                    foreach ($option in $options) {
                        $value = $option.value
                        
                        # ラベルを取得（日本語優先、なければ英語）
                        $label = $option.labels.label | Where-Object { $_.languagecode -eq '1041' } | Select-Object -ExpandProperty description
                        if (-not $label) {
                            $label = $option.labels.label | Where-Object { $_.languagecode -eq '1033' } | Select-Object -ExpandProperty description
                        }
                        
                        Write-Host "  $value : $label" -ForegroundColor White
                        $choiceValues += @{ Value = $value; Label = $label }
                    }
                    
                    # TypeScriptマッピング用に保存
                    $tsMapping += @{
                        Name = $attrName
                        DisplayName = $attrDisplayName
                        Choices = $choiceValues
                    }
                    
                    Write-Host ""
                } else {
                    Write-Host "  (No options defined - possibly a global optionset)" -ForegroundColor Gray
                    Write-Host ""
                }
            } else {
                Write-Host "  (No optionset element found)" -ForegroundColor Gray
                Write-Host ""
            }
        }
        
        # TypeScriptコードのサンプルを出力
        if ($tsMapping.Count -gt 0) {
            Write-Host "`n=== TypeScript Mapping Code Sample ===" -ForegroundColor Cyan
            Write-Host ""
            
            foreach ($mapping in $tsMapping) {
                $fieldName = $mapping.Name.Replace('geek_', '')
                $mapName = (Get-Culture).TextInfo.ToTitleCase($fieldName) + "ChoiceMap"
                
                Write-Host "// $($mapping.DisplayName)" -ForegroundColor Gray
                Write-Host "export const $mapName = {" -ForegroundColor White
                
                foreach ($choice in $mapping.Choices) {
                    $label = $choice.Label
                    $value = $choice.Value
                    Write-Host "  ${label}: $value," -ForegroundColor White
                }
                
                Write-Host "} as const;`n" -ForegroundColor White
            }
        }
        
        Write-Host "✓ Complete!`n" -ForegroundColor Green
        exit 0
    }
}

Write-Error "Entity '$EntityName' not found in XML"
exit 1
