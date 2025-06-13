-- tạo bảng lưu FTND_RESULT
CREATE TABLE FTND_RESULT (
    result_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    level NVARCHAR(20) NOT NULL CHECK (level IN (N'Low', N'Medium', N'High')),
    submitted_at DATETIME DEFAULT GETDATE(),
    
    CONSTRAINT fk_ftnd_user FOREIGN KEY (user_id) REFERENCES CUSTOMER(user_id) ON DELETE CASCADE
);


-- xóa bảng FTND_RESULT
DROP TABLE IF EXISTS FTND_RESULT;

-- them thuoc tinh vao bang customer
  ALTER TABLE CUSTOMER
    ADD ftnd_level NVARCHAR(20) NULL
    CHECK (ftnd_level IN (N'Low', N'Medium', N'High'));

-- xóa kq FTND_RESULT để test nhiều lần
	select* from CUSTOMER
	UPDATE CUSTOMER
  SET ftnd_level = NULL
  WHERE user_id = 2;