import { extendTheme } from '@chakra-ui/react'

const colors = {
    primary: {
        50: '#e6f0ff',
        100: '#b3d4ff',
        200: '#80b8ff',
        300: '#4d9cff',
        400: '#1a80ff',
        500: '#0066cc',
        600: '#0052a3',
        700: '#003d7a',
        800: '#002951',
        900: '#001428',
    },
    secondary: {
        50: '#e0f2fe',
        100: '#b3e0fe',
        200: '#7ccef7',
        300: '#4db4ed',
        400: '#1a9ae0',
        500: '#0099cc',
        600: '#0078a3',
        700: '#00577a',
        800: '#003651',
        900: '#001528',
    },
    accent: {
        50: '#e0f7ff',
        100: '#b3eeff',
        200: '#7fe5ff',
        300: '#4bdcff',
        400: '#1ad2ff',
        500: '#00a8e8',
        600: '#0085ba',
        700: '#00628c',
        800: '#003f5e',
        900: '#001c30',
    },
}

const theme = extendTheme({
    colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
    },
    styles: {
        global: {
            body: {
                bg: '#f8f9fa',
                color: '#1a1a2e',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            },
            html: {
                scrollBehavior: 'smooth',
            },
        },
    },
    components: {
        Button: {
            defaultProps: {
                colorScheme: 'primary',
            },
            variants: {
                solid: {
                    bg: '#0066cc',
                    color: 'white',
                    _hover: {
                        bg: '#004d99',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    },
                    _active: {
                        transform: 'translateY(0)',
                    },
                    transition: 'all 250ms ease-in-out',
                },
                outline: {
                    borderColor: '#0066cc',
                    color: '#0066cc',
                    _hover: {
                        bg: '#e6f0ff',
                    },
                },
                ghost: {
                    color: '#1a1a2e',
                    _hover: {
                        bg: '#f5f7fa',
                    },
                },
            },
        },
        Input: {
            variants: {
                outline: {
                    field: {
                        borderColor: '#d4dce6',
                        _focus: {
                            borderColor: '#0066cc',
                            boxShadow: '0 0 0 3px rgba(0, 102, 204, 0.1)',
                        },
                        _placeholder: {
                            color: '#a0aec0',
                        },
                    },
                },
            },
        },
        Card: {
            variants: {
                elevated: {
                    bg: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
                    _hover: {
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    },
                    transition: 'all 250ms ease-in-out',
                },
            },
        },
        Badge: {
            variants: {
                solid: {
                    bg: '#0066cc',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: 'xs',
                },
            },
        },
        Menu: {
            variants: {
                outline: {
                    list: {
                        borderColor: '#d4dce6',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },
        Heading: {
            variants: {
                h1: {
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#1a1a2e',
                },
                h2: {
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1a1a2e',
                },
                h3: {
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#1a1a2e',
                },
            },
        },
    },
    fonts: {
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        mono: 'menlo, monospace',
    },
    sizes: {
        container: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1400px',
        },
    },
    radii: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
    },
})

export default theme
