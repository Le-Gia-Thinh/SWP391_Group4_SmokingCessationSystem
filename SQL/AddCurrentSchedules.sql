-- Thêm lịch cho ngày hiện tại và tương lai để test
-- Lấy ngày hiện tại
DECLARE @CurrentDate DATE = GETDATE();
DECLARE @Tomorrow DATE = DATEADD(day, 1, @CurrentDate);
DECLARE @DayAfterTomorrow DATE = DATEADD(day, 2, @CurrentDate);

-- Thêm lịch cho ngày hiện tại
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time, is_booked)
SELECT 
    coach_id,
    DATEADD(hour, 9, CAST(@CurrentDate AS DATETIME)), -- 9:00 AM
    DATEADD(hour, 10, CAST(@CurrentDate AS DATETIME)), -- 10:00 AM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 14, CAST(@CurrentDate AS DATETIME)), -- 2:00 PM
    DATEADD(hour, 15, CAST(@CurrentDate AS DATETIME)), -- 3:00 PM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 16, CAST(@CurrentDate AS DATETIME)), -- 4:00 PM
    DATEADD(hour, 17, CAST(@CurrentDate AS DATETIME)), -- 5:00 PM
    0
FROM COACH 
WHERE status = 'active';

-- Thêm lịch cho ngày mai
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time, is_booked)
SELECT 
    coach_id,
    DATEADD(hour, 10, CAST(@Tomorrow AS DATETIME)), -- 10:00 AM
    DATEADD(hour, 11, CAST(@Tomorrow AS DATETIME)), -- 11:00 AM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 13, CAST(@Tomorrow AS DATETIME)), -- 1:00 PM
    DATEADD(hour, 14, CAST(@Tomorrow AS DATETIME)), -- 2:00 PM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 15, CAST(@Tomorrow AS DATETIME)), -- 3:00 PM
    DATEADD(hour, 16, CAST(@Tomorrow AS DATETIME)), -- 4:00 PM
    0
FROM COACH 
WHERE status = 'active';

-- Thêm lịch cho ngày kế tiếp
INSERT INTO COACH_SCHEDULE (coach_id, start_time, end_time, is_booked)
SELECT 
    coach_id,
    DATEADD(hour, 9, CAST(@DayAfterTomorrow AS DATETIME)), -- 9:00 AM
    DATEADD(hour, 10, CAST(@DayAfterTomorrow AS DATETIME)), -- 10:00 AM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 11, CAST(@DayAfterTomorrow AS DATETIME)), -- 11:00 AM
    DATEADD(hour, 12, CAST(@DayAfterTomorrow AS DATETIME)), -- 12:00 PM
    0
FROM COACH 
WHERE status = 'active'
UNION ALL
SELECT 
    coach_id,
    DATEADD(hour, 14, CAST(@DayAfterTomorrow AS DATETIME)), -- 2:00 PM
    DATEADD(hour, 15, CAST(@DayAfterTomorrow AS DATETIME)), -- 3:00 PM
    0
FROM COACH 
WHERE status = 'active'; 