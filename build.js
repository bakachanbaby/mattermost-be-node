const { exec } = require('child_process');

// Gọi lệnh build của dự án (ví dụ: sử dụng Babel để biên dịch mã nguồn)
exec('babel src -d dist', (error, stdout, stderr) => {
  if (error) {
    console.error(`Lỗi: ${error.message}`);
    return;
  }
  console.log('Build thành công');
});