// 医疗智能问诊平台 — 设计系统
// Medical AI Consultation Platform Design System
// 专业B端医疗后台风格 · 克制 · 精准 · 可信
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// ── 令牌层 ────────────────────────────────────────────
const colors = {
  brand: {
    50: '#EBF4FB',
    100: '#C5DEF5',
    200: '#9EC8EF',
    300: '#78B2E9',
    400: '#519CE3',
    500: '#3182CE',  // 主色
    600: '#2B6CB0',
    700: '#245692',
    800: '#1E4074',
    900: '#172B56',
  },

  surface: {
    page: '#F8FAFC',      // 页面底色（偏蓝冷白）
    card: '#FFFFFF',       // 卡片白
    hover: '#F1F5F9',      // 悬停态
    pressed: '#E2E8F0',    // 按下态
  },

  text: {
    primary: '#1E293B',    // 标题/正文
    secondary: '#64748B',  // 标签/说明
    tertiary: '#94A3B8',   // 占位/禁用
    inverse: '#FFFFFF',    // 深色底白字
  },

  border: {
    default: '#E2E8F0',
    light: '#F1F5F9',
    focus: '#3182CE',
  },

  // 医疗语义色 — 状态栏色条 + 徽章
  medical: {
    primary: '#3182CE',
    healthy: '#059669',     // 正常/健康 — 绿色
    attention: '#D97706',   // 关注/待观察 — 琥珀色
    critical: '#DC2626',    // 危急/异常 — 红色
    info: '#6366F1',        // 信息 — 靛蓝
  },

  // 解析状态
  status: {
    pending: '#94A3B8',
    processing: '#3182CE',
    completed: '#059669',
    failed: '#DC2626',
    needsInput: '#D97706',
  },
};

// ── 字体层 ────────────────────────────────────────────
const fonts = {
  heading: `'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif`,
  body: `'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif`,
};

// ── 组件覆盖层 ─────────────────────────────────────────
const components = {
  Button: {
    defaultProps: { colorScheme: 'brand' },
    baseStyle: {
      borderRadius: 'xl',
      fontWeight: 500,
      letterSpacing: '0.01em',
      transition: 'all 0.15s ease',
      _hover: { transform: 'translateY(-1px)', shadow: 'sm' },
      _active: { transform: 'translateY(0)', shadow: 'none' },
    },
  },

  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
        border: '1px solid',
        borderColor: 'border.default',
        bg: 'surface.card',
        transition: 'box-shadow 0.15s ease',
        _hover: { boxShadow: '0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)' },
      },
    },
  },

  Input: {
    baseStyle: {
      field: {
        borderRadius: 'xl',
        borderColor: 'border.default',
        bg: 'white',
        fontSize: '14px',
        _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(49,130,206,0.15)' },
        _placeholder: { color: 'text.tertiary' },
      },
    },
  },

  Select: {
    baseStyle: {
      field: { borderRadius: 'xl', borderColor: 'border.default', fontSize: '14px' },
    },
  },

  Textarea: {
    baseStyle: {
      borderRadius: 'xl',
      borderColor: 'border.default',
      fontSize: '14px',
      _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(49,130,206,0.15)' },
    },
  },

  Badge: {
    baseStyle: {
      borderRadius: 'md',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },

  Tag: {
    baseStyle: { container: { borderRadius: 'md' } },
  },

  Modal: {
    baseStyle: { dialog: { borderRadius: '2xl', boxShadow: 'xl' } },
  },

  Heading: {
    baseStyle: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: 'text.primary',
    },
  },

  Alert: {
    baseStyle: { container: { borderRadius: 'xl' } },
  },

  Tooltip: {
    baseStyle: { borderRadius: 'md', px: 3, py: 2, fontSize: '12px' },
  },
};

// ── 全局样式 ───────────────────────────────────────────
const styles = {
  global: {
    'html, body': {
      bg: 'surface.page',
      color: 'text.primary',
      fontSize: '14px',
      lineHeight: 1.6,
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    // 精致滚动条
    '::-webkit-scrollbar': { width: '5px', height: '5px' },
    '::-webkit-scrollbar-track': { bg: 'transparent' },
    '::-webkit-scrollbar-thumb': { bg: 'gray.300', borderRadius: '3px' },
    '::-webkit-scrollbar-thumb:hover': { bg: 'gray.400' },
    // Focus ring
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'brand.500',
      outlineOffset: '2px',
      borderRadius: 'md',
    },
  },
};

// ── 阴影层级 ───────────────────────────────────────────
const shadows = {
  xs: '0 1px 2px 0 rgba(0,0,0,0.03)',
  sm: '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
  md: '0 4px 12px 0 rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)',
  lg: '0 8px 24px 0 rgba(0,0,0,0.08), 0 4px 8px -1px rgba(0,0,0,0.04)',
  xl: '0 16px 40px 0 rgba(0,0,0,0.10), 0 6px 12px -2px rgba(0,0,0,0.05)',
};

// ── 间距规范 ───────────────────────────────────────────
const space = {
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px — 标准卡片内边距
  8: '2rem',      // 32px — 区块间距
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px — 页面级间距
};

// ── 组装导出 ───────────────────────────────────────────
const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  shadows,
  space,
});

export default theme;
