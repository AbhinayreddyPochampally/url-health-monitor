"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error)
    }
  }

  // Get from local storage then parse stored json or return initialValue
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key)
        if (item) {
          const parsedValue = JSON.parse(item)
          
          // Sanitize data for url-monitor-data to ensure arrays exist
          if (key === 'url-monitor-data' && Array.isArray(parsedValue)) {
            const sanitizedValue = parsedValue.map((url: any) => ({
              ...url,
              tags: Array.isArray(url.tags) ? url.tags : [],
              history: Array.isArray(url.history) ? url.history : []
            }))
            setStoredValue(sanitizedValue)
          } else {
            setStoredValue(parsedValue)
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }, [key])

  return [storedValue, setValue] as const
}