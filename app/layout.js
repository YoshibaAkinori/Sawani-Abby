// app/layout.js
import { StaffProvider } from '../contexts/StaffContext';

export const metadata = {
  title: "Sawani Abby",
  description: "スタッフとベッド管理",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <StaffProvider>
          {children}
        </StaffProvider>
      </body>
    </html>
  );
}
