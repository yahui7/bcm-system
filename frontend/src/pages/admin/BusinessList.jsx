import { useState, useEffect } from "react";
import { Table, Tag, Select, Input, Space } from "antd";
import api from "../../api";

export default function BusinessList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/bia/businesses").then((r) => setData(r.data.businesses || [])).finally(() => setLoading(false));
  }, []);

  const depts = [...new Set(data.map((d) => d.department).filter(Boolean))];

  const filtered = data.filter((d) => {
    if (search && !d.name.includes(search) && !d.owner.includes(search)) return false;
    if (dept && d.department !== dept) return false;
    return true;
  });

  return (
    <div>
      <h2 className="page-title">业务清单维护（管理员）</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜索业务名称或负责人" allowClear style={{ width: 280 }} onSearch={setSearch} />
        <Select placeholder="筛选部门" allowClear style={{ width: 180 }} onChange={setDept}
          options={depts.map((d) => ({ label: d, value: d }))} />
      </Space>
      <div className="bcm-card">
        <Table columns={[
          { title: "业务名称", dataIndex: "name" },
          { title: "部门", dataIndex: "department" },
          { title: "负责人", dataIndex: "owner" },
          { title: "BCM联络人", dataIndex: "bcm_contact" },
          { title: "BIA等级", dataIndex: "bia_tier", render: (v) => v ? <Tag color={v === "Tier 1" ? "red" : v === "Tier 2" ? "orange" : "green"}>{v}</Tag> : "-" },
        ]} dataSource={filtered} rowKey="id" loading={loading} />
      </div>
    </div>
  );
}
