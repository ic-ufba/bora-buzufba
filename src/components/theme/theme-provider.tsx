import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se já existe uma preferência salva
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    
    // Se não existe preferência salva, usar o tema padrão (light)
    if (!savedTheme) {
      console.log('Primeira vez do usuário - usando tema claro como padrão');
      return defaultTheme;
    }
    
    // Se existe preferência salva, usar ela
    console.log('Preferência de tema encontrada:', savedTheme);
    return savedTheme;
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      console.log('Alterando tema para:', newTheme);
      console.log('Salvando preferência do usuário no localStorage');
      
      // Salvar a preferência do usuário
      localStorage.setItem(storageKey, newTheme)
      
      // Atualizar o estado
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}