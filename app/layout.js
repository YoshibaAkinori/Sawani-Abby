// app/layout.js
import { StaffProvider } from '../contexts/StaffContext';
import { ScheduleProvider } from '../contexts/ScheduleContext';

export const metadata = {
  title: "Sawani Abby",
  description: "スタッフとベッド管理",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <StaffProvider>
          <ScheduleProvider>
            {children}
          </ScheduleProvider>
        </StaffProvider>
      </body>
    </html>
  );
}