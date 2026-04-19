import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  custom?: (value: any) => string | null
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  onValidationChange?: (isValid: boolean) => void
) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (fieldName: keyof T, value: any, rules?: ValidationRule): string | null => {
      if (rules?.required && (!value || value.toString().trim() === '')) {
        return typeof rules.required === 'string' ? rules.required : 'Este campo é obrigatório'
      }

      if (value && rules?.minLength && value.length < rules.minLength.value) {
        return rules.minLength.message
      }

      if (value && rules?.maxLength && value.length > rules.maxLength.value) {
        return rules.maxLength.message
      }

      if (value && rules?.pattern && !rules.pattern.value.test(value)) {
        return rules.pattern.message
      }

      if (rules?.custom) {
        return rules.custom(value) || null
      }

      return null
    },
    []
  )

  const handleChange = useCallback(
    (fieldName: keyof T, value: any, rules?: ValidationRule) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }))

      // Validar apenas se o campo foi tocado
      if (touched[fieldName]) {
        const error = validateField(fieldName, value, rules)
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error || undefined,
        }))
      }
    },
    [validateField, touched]
  )

  const handleBlur = useCallback(
    (fieldName: keyof T, rules?: ValidationRule) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }))

      const error = validateField(fieldName, values[fieldName], rules)
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error || undefined,
      }))
    },
    [validateField, values]
  )

  const validate = useCallback(
    (allRules: Partial<Record<keyof T, ValidationRule>>): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {}

      Object.entries(allRules).forEach(([field, rules]) => {
        if (!rules) return
        const error = validateField(field as keyof T, values[field as keyof T], rules)
        if (error) {
          newErrors[field as keyof T] = error
        }
      })

      setErrors(newErrors)
      setTouched(
        Object.keys(allRules).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        ) as Partial<Record<keyof T, boolean>>
      )

      const isValid = Object.keys(newErrors).length === 0
      onValidationChange?.(isValid)

      return isValid
    },
    [validateField, values, onValidationChange]
  )

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
  }
}
