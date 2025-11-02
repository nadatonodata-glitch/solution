export const handleAppClick = (appName: string, callback?: (message: string) => void) => {
  const message = `Đang mở ${appName}...`;
  if (callback) {
    callback(message);
  }
};

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
