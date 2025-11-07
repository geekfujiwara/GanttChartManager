/**
 * Combobox コンポーネント
 * 検索可能なドロップダウン選択UI
 */

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "選択してください...",
  searchPlaceholder = "検索...",
  emptyMessage = "見つかりませんでした。",
  className,
  disabled = false
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  // 検索クエリでオプションをフィルタリング
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options

    const query = searchQuery.toLowerCase()
    return options.filter((option) => {
      const searchText = `${option.label} ${option.description || ""}`.toLowerCase()
      return searchText.includes(query)
    })
  }, [options, searchQuery])

  // マウスホイールスクロールを有効化
  React.useEffect(() => {
    const listElement = listRef.current
    if (!listElement) return

    const handleWheel = (e: WheelEvent) => {
      // デフォルトのスクロール動作を許可
      e.stopPropagation()
    }

    listElement.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      listElement.removeEventListener('wheel', handleWheel)
    }
  }, [open])

  console.log('🎨 Combobox render:', {
    optionsCount: options.length,
    filteredCount: filteredOptions.length,
    searchQuery,
    value,
    selectedOption
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0" 
        align="start"
        onWheel={(e) => {
          // Popoverコンテンツ内でのホイールスクロールを許可
          e.stopPropagation()
        }}
      >
        <Command
          shouldFilter={false}
          onKeyDown={(e) => {
            // Enterキーでフォーム送信を防ぐ
            if (e.key === 'Enter') {
              e.preventDefault()
            }
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList 
            ref={listRef}
            className="max-h-[300px] overflow-y-auto overscroll-contain"
            style={{ 
              // マウスホイールスクロールを強制的に有効化
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    console.log('✅ Option selected:', option.label, currentValue)
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchQuery("") // 検索クエリをリセット
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
