import { Noto_Serif_KR, Cinzel_Decorative } from 'next/font/google'
import './globals.css'

const notoSerifKR = Noto_Serif_KR({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto',
})

const cinzelDecorative = Cinzel_Decorative({
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-cinzel',
})

export const metadata = {
  title: 'Chronicles of Fate | AI 텍스트 RPG',
  description: 'AI가 실시간으로 스토리를 생성하는 텍스트 RPG',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${notoSerifKR.variable} ${cinzelDecorative.variable}`}>
        {children}
      </body>
    </html>
  )
}
