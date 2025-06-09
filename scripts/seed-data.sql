-- Seed sample data for URL Monitor

-- Insert sample URLs for testing
INSERT INTO monitored_urls (url, uptime_percentage) VALUES 
    ('', 0)
ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP,
    uptime_percentage = VALUES(uptime_percentage);

-- Get the URL IDs for seeding health checks
SET @google_id = (SELECT id FROM monitored_urls WHERE url = '');
SET @github_id = (SELECT id FROM monitored_urls WHERE url = '');
SET @stackoverflow_id = (SELECT id FROM monitored_urls WHERE url = '');
SET @vercel_id = (SELECT id FROM monitored_urls WHERE url = '');
SET @down_id = (SELECT id FROM monitored_urls WHERE url = '');

-- Insert sample health check data (last 24 hours)
INSERT INTO url_health_checks (url_id, status, response_time, status_code, checked_at) VALUES
    (@google_id, '', 0, 0, NOW()),
    (@github_id, '', 0, 0, NOW()),
    (@stackoverflow_id, '', 0, 0, NOW()),
    (@vercel_id, '', 0, 0, NOW()),
    (@down_id, '', 0, 0, NOW());

-- Calculate and insert statistics
INSERT INTO url_statistics (
    url_id, 
    total_checks, 
    successful_checks, 
    failed_checks, 
    avg_response_time, 
    uptime_percentage, 
    last_up_at,
    last_down_at,
    last_check_at
)
SELECT 
    url_id,
    COUNT(*) as total_checks,
    SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as successful_checks,
    SUM(CASE WHEN status = 'DOWN' THEN 1 ELSE 0 END) as failed_checks,
    AVG(CASE WHEN response_time IS NOT NULL THEN response_time END) as avg_response_time,
    (SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as uptime_percentage,
    MAX(CASE WHEN status = 'UP' THEN checked_at END) as last_up_at,
    MAX(CASE WHEN status = 'DOWN' THEN checked_at END) as last_down_at,
    MAX(checked_at) as last_check_at
FROM url_health_checks 
GROUP BY url_id
ON DUPLICATE KEY UPDATE
    total_checks = VALUES(total_checks),
    successful_checks = VALUES(successful_checks),
    failed_checks = VALUES(failed_checks),
    avg_response_time = VALUES(avg_response_time),
    uptime_percentage = VALUES(uptime_percentage),
    last_up_at = VALUES(last_up_at),
    last_down_at = VALUES(last_down_at),
    last_check_at = VALUES(last_check_at),
    updated_at = CURRENT_TIMESTAMP;

-- Insert some additional historical data for better charts
INSERT INTO url_health_checks (url_id, status, response_time, status_code, checked_at) VALUES
    -- Add more historical data points for the last 7 days
    (@google_id, 'UP', 122, 200, NOW() - INTERVAL 1 DAY),
    (@google_id, 'UP', 118, 200, NOW() - INTERVAL 2 DAY),
    (@google_id, 'UP', 125, 200, NOW() - INTERVAL 3 DAY),
    
    (@github_id, 'UP', 91, 200, NOW() - INTERVAL 1 DAY),
    (@github_id, 'DOWN', NULL, 500, NOW() - INTERVAL 2 DAY),
    (@github_id, 'UP', 87, 200, NOW() - INTERVAL 3 DAY),
    
    (@vercel_id, 'UP', 47, 200, NOW() - INTERVAL 1 DAY),
    (@vercel_id, 'UP', 49, 200, NOW() - INTERVAL 2 DAY),
    (@vercel_id, 'UP', 46, 200, NOW() - INTERVAL 3 DAY);
