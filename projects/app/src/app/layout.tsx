'use client';

import { ChakraProvider, Box } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import theme from '@/styles/theme';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>医疗智能问诊平台 - AI 辅助诊断与病历分析</title>
        <meta name="description" content="多模型兼容驱动的医疗动态问诊平台，支持 AI 智能问诊、病历上传与解析、多模型切换" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {/* Next.js 13+ 需要 CacheProvider 支持 Chakra UI */}
        <ChakraProvider theme={theme}>
          <Box minH="100vh" display="flex">
            <Sidebar />
            <Box flex="1" display="flex" flexDirection="column">
              <Header />
              <Box as="main" flex="1" p={6} overflow="auto">
                {children}
              </Box>
            </Box>
          </Box>
        </ChakraProvider>
      </body>
    </html>
  );
}
