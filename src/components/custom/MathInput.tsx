import { useRef, useEffect } from 'react'
import type { MathfieldElement } from 'mathlive'
import "//unpkg.com/mathlive";
import "https://unpkg.com/mathlive@0.101.2/dist/mathlive.min.js";

interface MathInputProps {
  initialValue: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

const MathInput = ({ initialValue, onChange, placeholder }: MathInputProps) => {
  const mathfieldRef = useRef<MathfieldElement | null>(null)

  useEffect(() => {
    // Import MathLive dynamically to avoid SSR issues
    import('mathlive').then(({ MathfieldElement }) => {
      // Register the web component
      if (!customElements.get('math-field')) {
        customElements.define('math-field', MathfieldElement)
      }

      // Create and configure the mathfield
      if (mathfieldRef.current) {
        mathfieldRef.current.value = initialValue
        mathfieldRef.current.addEventListener('input', () => {
          if (mathfieldRef.current) {
            onChange(mathfieldRef.current.value)
          }
        })
      }
    })
  }, [])

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2">
        <math-field
          ref={mathfieldRef}
          virtual-keyboard-mode="onfocus"
          virtual-keyboards="numeric symbols"

          placeholder={placeholder}
          style={{
            width: 'auto',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
      </div>
    </div>
  )
}

export default MathInput

