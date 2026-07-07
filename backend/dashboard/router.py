"""
Dashboard 统计 API
"""
from fastapi import APIRouter
from backend.database import get_connection

router = APIRouter()


@router.get("/overview")
async def overview():
    conn = get_connection()
    cursor = conn.cursor()

    # 业务统计
    cursor.execute("SELECT COUNT(*) as total FROM businesses")
    total_biz = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) as critical FROM businesses WHERE is_critical = 1")
    critical = cursor.fetchone()["critical"]

    # BCP 覆盖率
    cursor.execute("SELECT COUNT(DISTINCT business_id) as bcps FROM bcp_plans")
    bcp_biz = cursor.fetchone()["bcps"]
    bcp_rate = round(bcp_biz / max(total_biz, 1) * 100, 1)

    # 演练完成率
    cursor.execute("SELECT COUNT(*) as total FROM drill_plans")
    total_drills = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) as done FROM drill_plans WHERE status = '已完成'")
    done_drills = cursor.fetchone()["done"]
    drill_rate = round(done_drills / max(total_drills, 1) * 100, 1)

    # 待整改问题
    cursor.execute("SELECT COUNT(*) as issues FROM issues WHERE status != '已解决'")
    issue_count = cursor.fetchone()["issues"]

    stats = {
        "businesses": total_biz,
        "critical": critical,
        "bcp_rate": bcp_rate,
        "drill_rate": drill_rate,
        "issue_count": issue_count,
    }

    # 各业务 BCM 进度
    cursor.execute(
        """SELECT b.name,
                  CASE WHEN b.bia_tier != '' THEN 1 ELSE 0 END as bia_done,
                  (SELECT COUNT(*) FROM bcp_plans WHERE business_id = b.id) as bcp_count
           FROM businesses b ORDER BY b.name"""
    )
    biz_rows = cursor.fetchall()
    chart = {
        "names": [r["name"] for r in biz_rows],
        "bia": [r["bia_done"] * 100 for r in biz_rows],
        "bcp": [min(r["bcp_count"] * 50, 100) for r in biz_rows],
    }

    # 风险类别分布
    cursor.execute("SELECT category, COUNT(*) as cnt FROM risk_events GROUP BY category ORDER BY cnt DESC")
    pie = [{"name": r["category"] or "未分类", "value": r["cnt"]} for r in cursor.fetchall()]

    # 近期事件
    cursor.execute("SELECT * FROM risk_events ORDER BY event_date DESC LIMIT 5")
    events = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"status": "ok", "stats": stats, "chart": chart, "pie": pie, "events": events}
