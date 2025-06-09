-- Seed sample data for URL Monitor

-- Insert sample URLs for testing
INSERT INTO monitored_urls (url, uptime_percentage) VALUES 
    ('https://google.com', 99.9),
    ('https://github.com', 98.5),
    ('https://stackoverflow.com', 99.2),
    ('https://vercel.com', 99.8),
    ('https://example-down-site.com', 45.2)
ON DUPLICATE KEY UPDATE 
    updated_at = CURRENT_TIMESTAMP,
    uptime_percentage = VALUES(uptime_percentage);

-- Get the URL IDs for seeding health checks
SET @google_id = (SELECT id FROM monitored_urls WHERE url = 'https://google.com');
SET @github_id = (SELECT id FROM monitored_urls WHERE url = 'https://github.com');
SET @stackoverflow_id = (SELECT id FROM monitored_urls WHERE url = 'https://stackoverflow.com');
SET @vercel_id = (SELECT id FROM monitored_urls WHERE url = 'https://vercel.com');
SET @down_id = (SELECT id FROM monitored_urls WHERE url = 'https://example-down-site.com');

-- Insert sample health check data (last 24 hours)
INSERT INTO url_health_checks (url_id, status, response_time, status_code, checked_at) VALUES
    -- Google (mostly up, fast responses)
    (@google_id, 'UP', 120, 200, NOW() - INTERVAL 1 HOUR),
    (@google_id, 'UP', 115, 200, NOW() - INTERVAL 2 HOUR),
    (@google_id, 'UP', 130, 200, NOW() - INTERVAL 3 HOUR),
    (@google_id, 'UP', 125, 200, NOW() - INTERVAL 4 HOUR),
    (@google_id, 'UP', 118, 200, NOW() - INTERVAL 5 HOUR),
    
    -- GitHub (mostly up with occasional issues)
    (@github_id, 'UP', 89, 200, NOW() - INTERVAL 1 HOUR),
    (@github_id, 'DOWN', NULL, 503, NOW() - INTERVAL 2 HOUR),
    (@github_id, 'UP', 95, 200, NOW() - INTERVAL 3 HOUR),
    (@github_id, 'UP', 88, 200, NOW() - INTERVAL 4 HOUR),
    (@github_id, 'UP', 92, 200, NOW() - INTERVAL 5 HOUR),
    
    -- StackOverflow (consistently up, moderate speed)
    (@stackoverflow_id, 'UP', 200, 200, NOW() - INTERVAL 1 HOUR),
    (@stackoverflow_id, 'UP', 195, 200, NOW() - INTERVAL 2 HOUR),
    (@stackoverflow_id, 'UP', 210, 200, NOW() - INTERVAL 3 HOUR),
    (@stackoverflow_id, 'UP', 205, 200, NOW() - INTERVAL 4 HOUR),
    
    -- Vercel (consistently up, very fast)
    (@vercel_id, 'UP', 45, 200, NOW() - INTERVAL 1 HOUR),
    (@vercel_id, 'UP', 50, 200, NOW() - INTERVAL 2 HOUR),
    (@vercel_id, 'UP', 48, 200, NOW() - INTERVAL 3 HOUR),
    (@vercel_id, 'UP', 52, 200, NOW() - INTERVAL 4 HOUR),
    
    -- Down site (consistently down)
    (@down_id, 'DOWN', NULL, 0, NOW() - INTERVAL 1 HOUR),
    (@down_id, 'DOWN', NULL, 0, NOW() - INTERVAL 2 HOUR),
    (@down_id, 'DOWN', NULL, 0, NOW() - INTERVAL 3 HOUR),
    (@down_id, 'DOWN', NULL, 0, NOW() - INTERVAL 4 HOUR);

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
