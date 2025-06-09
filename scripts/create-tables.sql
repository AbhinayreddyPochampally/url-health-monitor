-- Create database schema for URL Monitor

-- URLs table to store monitored URLs
CREATE TABLE IF NOT EXISTS monitored_urls (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    uptime_percentage DECIMAL(5,2) DEFAULT 0.00
);

-- Health checks table to store check results
CREATE TABLE IF NOT EXISTS url_health_checks (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES monitored_urls(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('UP', 'DOWN', 'CHECKING')),
    response_time INTEGER, -- in milliseconds
    status_code INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_url_id (url_id),
    INDEX idx_checked_at (checked_at),
    INDEX idx_status (status)
);

-- URL statistics table for aggregated metrics
CREATE TABLE IF NOT EXISTS url_statistics (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES monitored_urls(id) ON DELETE CASCADE,
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    avg_response_time DECIMAL(10,2),
    uptime_percentage DECIMAL(5,2),
    last_up_at TIMESTAMP,
    last_down_at TIMESTAMP,
    last_check_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_url_stats (url_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_checks_url_status ON url_health_checks(url_id, status);
CREATE INDEX IF NOT EXISTS idx_health_checks_recent ON url_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_urls_active ON monitored_urls(is_active);

-- Create a view for easy access to URL health summary
CREATE OR REPLACE VIEW url_health_summary AS
SELECT 
    u.id,
    u.url,
    u.created_at,
    u.is_active,
    s.total_checks,
    s.successful_checks,
    s.failed_checks,
    s.uptime_percentage,
    s.avg_response_time,
    s.last_up_at,
    s.last_down_at,
    s.last_check_at,
    (SELECT status FROM url_health_checks WHERE url_id = u.id ORDER BY checked_at DESC LIMIT 1) as current_status,
    (SELECT response_time FROM url_health_checks WHERE url_id = u.id ORDER BY checked_at DESC LIMIT 1) as last_response_time
FROM monitored_urls u
LEFT JOIN url_statistics s ON u.id = s.url_id
WHERE u.is_active = true;
