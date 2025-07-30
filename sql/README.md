# 🗄️ DocCollab Database Migrations

This directory contains the complete database schema and migrations for DocCollab, a collaborative document editing platform built with Supabase and PostgreSQL.

## 📁 Migration Files Overview

### **Phase 1: Core Foundation**

- `001_phase1_core_foundation.sql` - Core tables and security
- `002_test_data_validation.sql` - Sample data and validation queries

### **Phase 2: Collaboration Features**

- `003_phase2_collaboration.sql` - Comments, versions, and presence
- `004_phase2_test_data.sql` - Collaboration test data and workflows

## 🚀 Quick Start Guide

### **Prerequisites**

- Supabase project with PostgreSQL database
- Supabase Auth enabled (provides `auth.users` table)
- Database access via Supabase SQL Editor or psql

### **Installation Steps**

1. **Run Phase 1 Migration**

   ```sql
   -- Copy and paste contents of 001_phase1_core_foundation.sql
   -- into your Supabase SQL Editor and execute
   ```

2. **Add Phase 1 Test Data** (Optional)

   ```sql
   -- Copy and paste contents of 002_test_data_validation.sql
   -- Update the UUID values with real user IDs from your auth.users table
   -- Execute to create sample data
   ```

3. **Run Phase 2 Migration**

   ```sql
   -- Copy and paste contents of 003_phase2_collaboration.sql
   -- into your Supabase SQL Editor and execute
   ```

4. **Add Phase 2 Test Data** (Optional)
   ```sql
   -- Copy and paste contents of 004_phase2_test_data.sql
   -- Execute to create collaboration test data
   ```

## 🏗️ Database Schema Overview

### **Core Tables (Phase 1)**

- **`profiles`** - Extended user information beyond Supabase Auth
- **`documents`** - Document storage with JSONB content and full-text search
- **`document_permissions`** - Role-based access control system

### **Collaboration Tables (Phase 2)**

- **`comments`** - Threaded comment system with mentions
- **`document_versions`** - Version history with delta storage
- **`user_presence`** - Real-time collaboration tracking

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Permission-based access** with role hierarchy (owner > editor > commenter > viewer)
- **Secure functions** for permission checking and business logic
- **Data validation** with check constraints and triggers

## 🚄 Performance Optimizations

- **Strategic indexes** for common query patterns
- **GIN indexes** for full-text search and JSONB operations
- **Composite indexes** for complex queries
- **Efficient presence cleanup** with TTL patterns

## 📊 Key Features Supported

### **Document Management**

- Rich text content storage in JSONB
- Full-text search across title, content, and metadata
- Document organization with categories and tags
- Public/private sharing with granular permissions

### **Real-time Collaboration**

- Live user presence tracking
- Cursor position and typing indicators
- Document version history with delta storage
- Threaded comments with mentions

### **Security & Permissions**

- Owner, editor, commenter, viewer role hierarchy
- Permission inheritance and sharing capabilities
- User mention system with notification support
- Audit trail for all changes and access

## 🧪 Testing & Validation

Each migration file includes:

- **Test data** for immediate experimentation
- **Validation queries** to verify correct setup
- **Performance testing** queries with EXPLAIN ANALYZE
- **Constraint testing** to ensure data integrity

## 📚 Learning Resources

- **`DATABASE_DESIGN.md`** - Comprehensive design documentation
- **`DOCCOLLAB_PLAN.md`** - Complete project plan and specifications
- **`DOCCOLLAB_PROGRESS.md`** - Development progress tracker

## 🔧 Maintenance

### **Regular Cleanup Tasks**

```sql
-- Clean up stale user presence data
SELECT cleanup_stale_presence();

-- This should be run periodically (every 5-10 minutes)
-- Consider setting up with pg_cron or external scheduler
```

### **Performance Monitoring**

```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🆘 Troubleshooting

### **Common Issues**

1. **User ID Mismatch in Test Data**

   - Update UUID values in test data files with actual user IDs from `auth.users`
   - Create test users through Supabase Auth first

2. **Permission Errors**

   - Ensure RLS policies are enabled: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`
   - Check user authentication: `SELECT auth.uid();`

3. **Performance Issues**
   - Verify indexes are being used: `EXPLAIN ANALYZE [your_query];`
   - Update table statistics: `ANALYZE;`

### **Getting Help**

- Check the validation queries in test data files
- Review the design documentation in `DATABASE_DESIGN.md`
- Test with the provided sample data before using real data

## 📈 Next Steps

After running these migrations:

1. **API Development** - Build REST endpoints for document operations
2. **Frontend Components** - Create React components for document editing
3. **Real-time Features** - Implement WebSocket connections for live collaboration
4. **File Attachments** - Add Phase 3 migrations for file storage
5. **Analytics** - Implement usage tracking and analytics

---

🎯 **Ready to build the future of collaborative document editing!** 🚀
