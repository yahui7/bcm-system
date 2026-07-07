"""
BCM 系统 — 数据库初始化
SQLite 连接管理 + 建表
"""
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "bcm.db")


def get_connection() -> sqlite3.Connection:
    """获取数据库连接"""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """创建所有表（IF NOT EXISTS）"""
    conn = get_connection()
    cursor = conn.cursor()

    # ========== 用户表 ==========
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('bu', 'admin', 'executive')),
            display_name TEXT NOT NULL,
            department TEXT DEFAULT '',
            business_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ========== 配置表 ==========
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bia_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dimension TEXT NOT NULL,
            weight REAL DEFAULT 0.2,
            sort_order INTEGER DEFAULT 0,
            enabled INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            factor_type TEXT NOT NULL CHECK(factor_type IN ('threat', 'vulnerability')),
            weight REAL DEFAULT 1.0,
            sort_order INTEGER DEFAULT 0,
            enabled INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS systems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner TEXT DEFAULT '',
            rto TEXT DEFAULT '',
            rpo TEXT DEFAULT '',
            app_type TEXT DEFAULT '',
            enabled INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recovery_strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            strategy_type TEXT NOT NULL CHECK(strategy_type IN ('preventive', 'recovery')),
            description TEXT DEFAULT '',
            resource_type TEXT DEFAULT '',
            enabled INTEGER DEFAULT 1
        )
    """)

    # ========== 业务数据表 ==========
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT DEFAULT '',
            owner TEXT DEFAULT '',
            bcm_contact TEXT DEFAULT '',
            description TEXT DEFAULT '',
            is_critical INTEGER DEFAULT 0,
            bia_data TEXT DEFAULT '{}',
            risk_data TEXT DEFAULT '{}',
            bia_score REAL DEFAULT 0,
            bia_tier TEXT DEFAULT '',
            status TEXT DEFAULT 'draft',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS business_dependencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            related_business_id INTEGER NOT NULL,
            dependency_type TEXT NOT NULL CHECK(dependency_type IN ('upstream', 'downstream')),
            description TEXT DEFAULT '',
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
            FOREIGN KEY (related_business_id) REFERENCES businesses(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bia_factor_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            factor_id INTEGER NOT NULL,
            day1 TEXT DEFAULT 'low',
            day3 TEXT DEFAULT 'low',
            week1 TEXT DEFAULT 'low',
            month1 TEXT DEFAULT 'low',
            final_level TEXT DEFAULT '',
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
            FOREIGN KEY (factor_id) REFERENCES bia_factors(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            resource_type TEXT NOT NULL,
            name TEXT NOT NULL,
            importance TEXT DEFAULT 'medium',
            rto TEXT DEFAULT '',
            rpo TEXT DEFAULT '',
            description TEXT DEFAULT '',
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_scenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            resource_id INTEGER,
            threat TEXT DEFAULT '',
            vulnerability TEXT DEFAULT '',
            threat_score REAL DEFAULT 1,
            vulnerability_score REAL DEFAULT 1,
            risk_score REAL DEFAULT 1,
            risk_level TEXT DEFAULT 'low',
            auto_generated INTEGER DEFAULT 1,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
            FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bcp_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER NOT NULL,
            plan_name TEXT DEFAULT '',
            bcp_json TEXT DEFAULT '{}',
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drill_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bcp_id INTEGER,
            business_id INTEGER NOT NULL,
            drill_date TEXT DEFAULT '',
            drill_type TEXT DEFAULT '桌面推演',
            participants TEXT DEFAULT '',
            objective TEXT DEFAULT '',
            status TEXT DEFAULT '未开始',
            FOREIGN KEY (bcp_id) REFERENCES bcp_plans(id) ON DELETE SET NULL,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drill_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            passed INTEGER DEFAULT 0,
            failure_reason TEXT DEFAULT '',
            actual_recovery_time TEXT DEFAULT '',
            report_json TEXT DEFAULT '{}',
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (plan_id) REFERENCES drill_plans(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER,
            event_date TEXT DEFAULT '',
            title TEXT NOT NULL,
            category TEXT DEFAULT '',
            description TEXT DEFAULT '',
            source_url TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id INTEGER,
            description TEXT NOT NULL,
            assignee TEXT DEFAULT '',
            solution TEXT DEFAULT '',
            status TEXT DEFAULT '待解决',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT DEFAULT '',
            FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS report_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT DEFAULT '',
            report_no TEXT DEFAULT '',
            author TEXT DEFAULT '',
            date TEXT DEFAULT '',
            template_id TEXT DEFAULT '',
            content_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("[DB] 数据库表创建完成")
