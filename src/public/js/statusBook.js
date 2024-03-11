// statusHelpers.js

function getStatusText(status) {
  switch (status) {
    case 0:
      return "Tạm ngưng";
    case 1:
      return "Đang tiến hành";
    case 2:
      return "Đã hoàn thành";
    default:
      return "Trạng thái không xác định";
  }
}

// Export the function to make it accessible in other files
module.exports = getStatusText;
