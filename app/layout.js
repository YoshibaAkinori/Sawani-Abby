// app/layout.js
export const metadata = {
  title: "Sawani Abby",
  description: "スタッフとベッド管理",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
