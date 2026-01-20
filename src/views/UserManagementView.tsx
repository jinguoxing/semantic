import { useMemo, useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    UserCog,
    Pencil,
    Trash2,
    X,
    Eye,
    EyeOff,
    Mail,
    Phone,
    Building2,
    BadgeCheck
} from 'lucide-react';

type UserStatus = '启用' | '停用' | '锁定';

type Department = {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
};

type UserItem = {
    id: string;
    name: string;
    email: string;
    phone: string;
    deptId: string;
    role: string;
    status: UserStatus;
    lastLogin: string;
    createdAt: string;
};

const departments: Department[] = [
    { id: 'dept_root', name: '数据语义治理中心', parentId: null, order: 1 },
    { id: 'dept_semantic_ops', name: '语义运营部', parentId: 'dept_root', order: 1 },
    { id: 'dept_version_council', name: '版本委员会', parentId: 'dept_root', order: 2 },
    { id: 'dept_security', name: '安全合规部', parentId: null, order: 2 },
    { id: 'dept_quality', name: '数据质量中心', parentId: null, order: 3 },
    { id: 'dept_data_service', name: '数据服务运营部', parentId: null, order: 4 },
    { id: 'dept_scene', name: '业务场景推进组', parentId: 'dept_data_service', order: 1 }
];

const roles = [
    '语义治理负责人',
    '语义治理专员',
    '版本委员会成员',
    '数据质量管理员',
    '安全审计',
    '数据服务运营',
    '业务分析师'
];

const initialUsers: UserItem[] = [
    {
        id: 'user_01',
        name: '王宁',
        email: 'wangning@company.com',
        phone: '13800001111',
        deptId: 'dept_root',
        role: '语义治理负责人',
        status: '启用',
        lastLogin: '2024-06-28 09:32',
        createdAt: '2023-11-12'
    },
    {
        id: 'user_02',
        name: '陈颖',
        email: 'chenying@company.com',
        phone: '13800002222',
        deptId: 'dept_semantic_ops',
        role: '语义治理专员',
        status: '启用',
        lastLogin: '2024-06-28 08:15',
        createdAt: '2024-01-08'
    },
    {
        id: 'user_03',
        name: '刘洋',
        email: 'liuyang@company.com',
        phone: '13800003333',
        deptId: 'dept_version_council',
        role: '版本委员会成员',
        status: '启用',
        lastLogin: '2024-06-27 17:40',
        createdAt: '2023-10-05'
    },
    {
        id: 'user_04',
        name: '张倩',
        email: 'zhangqian@company.com',
        phone: '13800004444',
        deptId: 'dept_security',
        role: '安全审计',
        status: '启用',
        lastLogin: '2024-06-27 16:22',
        createdAt: '2023-09-21'
    },
    {
        id: 'user_05',
        name: '李晨',
        email: 'lichen@company.com',
        phone: '13800005555',
        deptId: 'dept_quality',
        role: '数据质量管理员',
        status: '启用',
        lastLogin: '2024-06-27 15:02',
        createdAt: '2023-12-18'
    },
    {
        id: 'user_06',
        name: '赵敏',
        email: 'zhaomin@company.com',
        phone: '13800006666',
        deptId: 'dept_data_service',
        role: '数据服务运营',
        status: '停用',
        lastLogin: '2024-06-20 11:30',
        createdAt: '2024-02-09'
    },
    {
        id: 'user_07',
        name: '周琪',
        email: 'zhouqi@company.com',
        phone: '13800007777',
        deptId: 'dept_scene',
        role: '业务分析师',
        status: '锁定',
        lastLogin: '2024-06-19 14:20',
        createdAt: '2024-03-14'
    }
];

const formatDate = () => new Date().toISOString().split('T')[0];

const UserManagementView = () => {
    const [users, setUsers] = useState<UserItem[]>(initialUsers);
    const [activeDeptId, setActiveDeptId] = useState<string>('all');
    const [activeUserId, setActiveUserId] = useState<string>(initialUsers[0]?.id ?? '');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [draftUser, setDraftUser] = useState<UserItem | null>(null);

    const deptTree = useMemo(() => {
        const build = (parentId: string | null, level: number): Array<{ item: Department; level: number }> => {
            return departments
                .filter((item) => item.parentId === parentId)
                .sort((a, b) => a.order - b.order)
                .flatMap((item) => [{ item, level }, ...build(item.id, level + 1)]);
        };
        return build(null, 0);
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch = `${user.name}${user.email}${user.phone}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesDept = activeDeptId === 'all' || user.deptId === activeDeptId;
            return matchesSearch && matchesStatus && matchesRole && matchesDept;
        });
    }, [users, searchTerm, statusFilter, roleFilter, activeDeptId]);

    const activeUser = users.find((user) => user.id === activeUserId) ?? users[0];
    const activeDept = departments.find((dept) => dept.id === activeDeptId);
    const totalUsers = users.length;
    const enabledUsers = users.filter((user) => user.status === '启用').length;
    const lockedUsers = users.filter((user) => user.status === '锁定').length;

    const openCreateModal = () => {
        setModalMode('create');
        setDraftUser({
            id: `user_${Date.now()}`,
            name: '',
            email: '',
            phone: '',
            deptId: activeDeptId === 'all' ? departments[0]?.id ?? '' : activeDeptId,
            role: roles[0],
            status: '启用',
            lastLogin: '-',
            createdAt: formatDate()
        });
        setModalOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        setModalMode('edit');
        setDraftUser({ ...user });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setDraftUser(null);
    };

    const handleSave = () => {
        if (!draftUser) {
            return;
        }
        if (!draftUser.name.trim() || !draftUser.email.trim()) {
            alert('请填写用户姓名与邮箱。');
            return;
        }
        if (modalMode === 'create') {
            setUsers((prev) => [draftUser, ...prev]);
            setActiveUserId(draftUser.id);
        } else {
            setUsers((prev) => prev.map((item) => (item.id === draftUser.id ? draftUser : item)));
        }
        closeModal();
    };

    const handleToggleStatus = (user: UserItem) => {
        const nextStatus: UserStatus = user.status === '启用' ? '停用' : '启用';
        setUsers((prev) =>
            prev.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item))
        );
    };

    const handleDelete = (user: UserItem) => {
        if (!confirm('确定要删除该用户吗？')) {
            return;
        }
        setUsers((prev) => {
            const next = prev.filter((item) => item.id !== user.id);
            if (activeUserId === user.id) {
                setActiveUserId(next[0]?.id ?? '');
            }
            return next;
        });
    };

    const getDeptName = (deptId: string) => departments.find((dept) => dept.id === deptId)?.name ?? '未归属';

    return (
        <div className="space-y-6 h-full flex flex-col pt-6 pb-2 px-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserCog size={22} className="text-indigo-600" />
                        用户管理
                    </h2>
                    <p className="text-slate-500 mt-1">将用户归属到组织架构，并统一管理角色与状态。</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                        <Filter size={14} className="inline mr-1" /> 批量导入
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                    >
                        <Plus size={16} /> 新建用户
                    </button>
                </div>
            </div>

            <div className="grid gap-4 px-1 md:grid-cols-4">
                {[
                    { label: '用户总数', value: `${totalUsers}`, note: '平台用户' },
                    { label: '启用用户', value: `${enabledUsers}`, note: '可登录使用' },
                    { label: '锁定用户', value: `${lockedUsers}`, note: '安全冻结' },
                    { label: '当前组织', value: activeDept?.name ?? '全部组织', note: '按组织筛选' }
                ].map((item) => (
                    <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <div className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 px-1 lg:grid-cols-[1.05fr_1.4fr]">
                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="搜索姓名、邮箱或手机号"
                            className="w-full text-sm text-slate-700 placeholder-slate-400 border-none outline-none"
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Filter size={14} />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as 'all' | UserStatus)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            <option value="all">全部状态</option>
                            <option value="启用">启用</option>
                            <option value="停用">停用</option>
                            <option value="锁定">锁定</option>
                        </select>
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                        >
                            <option value="all">全部角色</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-500">组织架构</p>
                        <div className="mt-3 space-y-2">
                            <button
                                type="button"
                                onClick={() => setActiveDeptId('all')}
                                className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${
                                    activeDeptId === 'all'
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                        : 'border-slate-200 text-slate-600 hover:border-indigo-200'
                                }`}
                            >
                                全部组织
                            </button>
                            {deptTree.map(({ item, level }) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveDeptId(item.id)}
                                    className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${
                                        activeDeptId === item.id
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                            : 'border-slate-200 text-slate-600 hover:border-indigo-200'
                                    }`}
                                    style={{ paddingLeft: 12 + level * 12 }}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">用户列表</h3>
                            <p className="mt-1 text-sm text-slate-500">选中用户查看详情并操作。</p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-3">
                            {filteredUsers.map((user) => {
                                const isActive = user.id === activeUserId;
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => setActiveUserId(user.id)}
                                        className={`w-full text-left rounded-xl border p-4 transition ${
                                            isActive
                                                ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                                                : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                                                    <span className="text-xs text-slate-400">{user.role}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {getDeptName(user.deptId)}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${
                                                    user.status === '启用'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : user.status === '锁定'
                                                            ? 'bg-rose-50 text-rose-600'
                                                            : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {user.status}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} /> {user.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} /> {user.phone}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <div className="text-xs text-slate-400">暂无匹配用户</div>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-base font-semibold text-slate-800">{activeUser?.name ?? '—'}</h4>
                                    <p className="text-xs text-slate-500">{activeUser?.role ?? '-'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => activeUser && openEditModal(activeUser)}
                                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        <Pencil size={12} /> 编辑
                                    </button>
                                    <button
                                        onClick={() => activeUser && handleToggleStatus(activeUser)}
                                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                    >
                                        {activeUser?.status === '启用' ? <EyeOff size={12} /> : <Eye size={12} />}
                                        {activeUser?.status === '启用' ? '停用' : '启用'}
                                    </button>
                                    <button
                                        onClick={() => activeUser && handleDelete(activeUser)}
                                        className="px-2 py-1 rounded-lg border border-rose-200 text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> 删除
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { label: '邮箱', value: activeUser?.email ?? '-', icon: Mail },
                                    { label: '手机号', value: activeUser?.phone ?? '-', icon: Phone },
                                    { label: '所属组织', value: getDeptName(activeUser?.deptId ?? ''), icon: Building2 },
                                    { label: '状态', value: activeUser?.status ?? '-', icon: BadgeCheck }
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-slate-200 p-3">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{item.label}</span>
                                            <item.icon size={14} className="text-indigo-500" />
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-slate-800">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
                                最近登录：{activeUser?.lastLogin ?? '-'}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && draftUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40">
                    <div className="min-h-screen p-4 flex items-start justify-center">
                        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex max-h-[92vh] flex-col">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        {modalMode === 'create' ? '新建用户' : '编辑用户'}
                                    </h3>
                                    <p className="text-xs text-slate-500">配置用户信息与组织归属。</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-6 px-6 py-6 overflow-y-auto">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">姓名</label>
                                        <input
                                            value={draftUser.name}
                                            onChange={(event) => setDraftUser({ ...draftUser, name: event.target.value })}
                                            placeholder="用户姓名"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">邮箱</label>
                                        <input
                                            value={draftUser.email}
                                            onChange={(event) => setDraftUser({ ...draftUser, email: event.target.value })}
                                            placeholder="name@company.com"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">手机号</label>
                                        <input
                                            value={draftUser.phone}
                                            onChange={(event) => setDraftUser({ ...draftUser, phone: event.target.value })}
                                            placeholder="138xxxxxxx"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">所属组织</label>
                                        <select
                                            value={draftUser.deptId}
                                            onChange={(event) =>
                                                setDraftUser({ ...draftUser, deptId: event.target.value })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">角色</label>
                                        <select
                                            value={draftUser.role}
                                            onChange={(event) => setDraftUser({ ...draftUser, role: event.target.value })}
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-600">状态</label>
                                        <select
                                            value={draftUser.status}
                                            onChange={(event) =>
                                                setDraftUser({ ...draftUser, status: event.target.value as UserStatus })
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                                        >
                                            <option value="启用">启用</option>
                                            <option value="停用">停用</option>
                                            <option value="锁定">锁定</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    {modalMode === 'create' ? '创建用户' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
