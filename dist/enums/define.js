const REQUEST_STATUS = {
  //Vừa khởi tạo
  IDLE: 'IDLE',
  //Đã gửi request
  SENT: 'SENT',
  //Đang chờ xử lý
  PENDING: 'PENDING',
  //Đang chờ ý kiến
  WAITING: 'WAITING',
  //Đã xử lý
  APPROVED: 'APPROVED',
  //Đã từ chối
  REJECTED: 'REJECTED'
};
module.exports = {
  REQUEST_STATUS
};