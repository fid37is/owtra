'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Users,
    CreditCard,
    BarChart3,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    LogOut,
    Plus,
    Trash2,
    Mail,
    Search,
    Loader2
} from 'lucide-react'
import AIStatus from './ai-status'
import { toast } from 'sonner'
import type { Profile, Subscription, Invoice } from '@/lib/supabase/dodo-types'

interface DashboardStats {
    totalUsers: number
    premiumUsers: number
    activeSubscriptions: number
    totalApplicationsTracked: number
    totalRevenue: number
    monthlyRecurringRevenue: number
}

export default function AdminDashboard() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [adminUsers, setAdminUsers] = useState<Profile[]>([])
    const [allUsers, setAllUsers] = useState<Profile[]>([])
    const [searchEmail, setSearchEmail] = useState('')
    const [newAdminEmail, setNewAdminEmail] = useState('')
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'admins'>('overview')
    const [addingAdmin, setAddingAdmin] = useState(false)
    const [removingAdminId, setRemovingAdminId] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch from API routes instead of directly from Supabase
            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/admin/users'),
                fetch('/api/admin/stats')
            ])

            const { users } = await usersRes.json()
            const statsData = await statsRes.json()

            console.log('Total users fetched from API:', users?.length)

            setAllUsers(users || [])
            setAdminUsers(users?.filter((u: Profile) => u.is_admin) || [])
            setStats(statsData)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            toast.success('Logged out successfully')
            router.push('/')
            router.refresh()
        } catch (error) {
            toast.error('Failed to logout')
        }
    }

    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) {
            toast.error('Please enter an email')
            return
        }

        setAddingAdmin(true)
        try {
            // Find user by email from our local state
            const user = allUsers.find(u =>
                u.email?.toLowerCase() === newAdminEmail.trim().toLowerCase()
            )

            if (!user) {
                toast.error('User not found')
                setAddingAdmin(false)
                return
            }

            // Update via API
            const response = await fetch('/api/admin/update-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, isAdmin: true })
            })

            if (!response.ok) throw new Error('Failed to update admin status')

            toast.success(`${user.email} is now an admin`)
            setNewAdminEmail('')
            fetchDashboardData()
        } catch (error: any) {
            console.error('Error adding admin:', error)
            toast.error(error.message || 'Failed to add admin')
        } finally {
            setAddingAdmin(false)
        }
    }

    const handleRemoveAdmin = async (userId: string, email: string | null) => {
        setRemovingAdminId(userId)
        try {
            const response = await fetch('/api/admin/update-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isAdmin: false })
            })

            if (!response.ok) throw new Error('Failed to update admin status')

            toast.success(`${email} is no longer an admin`)
            fetchDashboardData()
        } catch (error: any) {
            console.error('Error removing admin:', error)
            toast.error(error.message || 'Failed to remove admin')
        } finally {
            setRemovingAdminId(null)
        }
    }

    const StatCard = ({
        icon: Icon,
        label,
        value
    }: {
        icon: any
        label: string
        value: string | number
    }) => (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-2">{label}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
            </div>
        </div>
    )

    const filteredUsers = allUsers.filter(user =>
        user.email?.toLowerCase().includes(searchEmail.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage and monitor Owtra</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* System Status */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">System Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <AIStatus />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Database</p>
                                    <p className="text-xs text-muted-foreground">Connected</p>
                                </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 border-b border-border">
                    {(['overview', 'users', 'admins'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab === 'overview' && 'Overview'}
                            {tab === 'users' && `Users (${allUsers.length})`}
                            {tab === 'admins' && `Admins (${adminUsers.length})`}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={stats.totalUsers}
                            />
                            <StatCard
                                icon={CreditCard}
                                label="Premium Users"
                                value={stats.premiumUsers}
                            />
                            <StatCard
                                icon={CheckCircle}
                                label="Active Subscriptions"
                                value={stats.activeSubscriptions}
                            />
                            <StatCard
                                icon={BarChart3}
                                label="Applications Tracked"
                                value={stats.totalApplicationsTracked}
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Total Revenue"
                                value={`$${stats.totalRevenue.toFixed(2)}`}
                            />
                            <StatCard
                                icon={CreditCard}
                                label="Monthly Recurring Revenue"
                                value={`$${stats.monthlyRecurringRevenue.toFixed(2)}`}
                            />
                        </div>

                        {/* Quick Info */}
                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 p-6">
                            <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-foreground"><span className="font-semibold">{stats.premiumUsers}</span> out of <span className="font-semibold">{stats.totalUsers}</span> users have premium subscriptions</p>
                                <p className="text-foreground">Free tier users: <span className="font-semibold">{stats.totalUsers - stats.premiumUsers}</span></p>
                                <p className="text-foreground">Average applications per user: <span className="font-semibold">{stats.totalUsers > 0 ? (stats.totalApplicationsTracked / stats.totalUsers).toFixed(1) : 0}</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-muted-foreground absolute ml-3" />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-3 text-sm text-foreground">{user.email || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-sm text-foreground">{user.full_name || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.account_status === 'active'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                            }`}>
                                                            {user.account_status === 'active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_admin
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                                                            }`}>
                                                            {user.is_admin ? 'Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                    No users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admins Tab */}
                {activeTab === 'admins' && (
                    <div className="space-y-6">
                        {/* Add Admin Form */}
                        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Add New Admin</h3>
                            <div className="flex gap-3">
                                <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        placeholder="Enter email address..."
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleAddAdmin}
                                    disabled={addingAdmin}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                >
                                    {addingAdmin ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Add Admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Admins List */}
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminUsers.length > 0 ? (
                                            adminUsers.map((admin) => (
                                                <tr key={admin.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <td className="px-6 py-3 text-sm text-foreground">{admin.email || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-sm text-foreground">{admin.full_name || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-sm text-muted-foreground">
                                                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm">
                                                        <button
                                                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                                                            disabled={removingAdminId === admin.id}
                                                            className="text-destructive hover:text-destructive/80 disabled:opacity-50 flex items-center gap-1 font-medium"
                                                        >
                                                            {removingAdminId === admin.id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Removing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Remove
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                    No admins found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}