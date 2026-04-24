# Strategic Plan: Gamification & Neighborhood Found Items Features

## Executive Summary

This document outlines the strategic implementation plan for two key features in TruCycle:

1. **Gamification System** - Streaks, badges, and rewards to increase user engagement
2. **Neighborhood Found Items** - Allow users to post items they find in their neighborhood for community pickup

Both features align with TruCycle's mission of reducing waste through local exchange while adding engagement mechanics that encourage consistent participation.

---

## Table of Contents

1. [Gamification System](#1-gamification-system)
   - [Feature Overview](#11-feature-overview)
   - [User Stories](#12-user-stories)
   - [Technical Architecture](#13-technical-architecture)
   - [Data Models](#14-data-models)
   - [API Endpoints](#15-api-endpoints)
   - [Frontend Implementation](#16-frontend-implementation)
   - [Implementation Phases](#17-implementation-phases)
2. [Neighborhood Found Items](#2-neighborhood-found-items)
   - [Feature Overview](#21-feature-overview)
   - [User Stories](#22-user-stories)
   - [Technical Architecture](#23-technical-architecture)
   - [Data Models](#24-data-models)
   - [API Endpoints](#25-api-endpoints)
   - [Frontend Implementation](#26-frontend-implementation)
   - [Implementation Phases](#27-implementation-phases)
3. [Cross-Feature Considerations](#3-cross-feature-considerations)
4. [Risk Assessment & Mitigation](#4-risk-assessment--mitigation)
5. [Success Metrics](#5-success-metrics)
6. [Timeline Estimate](#6-timeline-estimate)

---

## 1. Gamification System

### 1.1 Feature Overview

The gamification system introduces engagement mechanics to encourage consistent participation in the TruCycle ecosystem. Users earn badges for achievements, maintain streaks for regular activity, and receive rewards for positive impact.

**Core Components:**

- **Streaks**: Track consecutive days/weeks of activity (donations, collections, exchanges)
- **Badges**: Achievement markers for specific milestones
- **Points/XP**: Quantifiable progress tied to actions
- **Levels**: Progression tiers based on accumulated points
- **Leaderboards**: Community rankings (optional, privacy-aware)

### 1.2 User Stories

#### Streaks
- As a user, I want to see my current activity streak so I can stay motivated
- As a user, I want to receive reminders when my streak is about to break
- As a user, I want to see my longest streak record

#### Badges
- As a user, I want to earn badges for completing specific actions (first donation, 10 items collected, etc.)
- As a user, I want to display my earned badges on my profile
- As a user, I want to see available badges I can work toward

#### Points & Levels
- As a user, I want to earn points for every positive action
- As a user, I want to see my level and progress to the next level
- As a user, I want to understand how different actions award different point values

### 1.3 Technical Architecture

#### Frontend Structure (Feature-First Pattern)

```
src/features/gamification/
├── api/
│   └── gamificationApi.ts       # API calls for gamification data
├── hooks/
│   ├── useUserProgress.ts       # Hook for user progress/XP/level
│   ├── useStreaks.ts            # Hook for streak data
│   └── useBadges.ts             # Hook for badge data
├── types.ts                     # Gamification types
├── ui/
│   ├── components/
│   │   ├── StreakIndicator.tsx      # Streak flame/counter display
│   │   ├── BadgeCard.tsx            # Individual badge display
│   │   ├── BadgeGrid.tsx            # Grid of badges
│   │   ├── ProgressBar.tsx          # Level progress bar
│   │   ├── LevelBadge.tsx           # Current level indicator
│   │   ├── PointsEarnedToast.tsx    # Toast for earning points
│   │   └── AchievementUnlocked.tsx  # Modal/toast for new badges
│   ├── GamificationDashboard.tsx    # Full gamification overview
│   └── ProfileBadges.tsx            # Badge display for profile
└── state/
    └── gamificationStore.ts         # Optional: if global state needed
```

#### Integration Points

1. **Dashboard** (`src/features/home/ui/Dashboard.tsx`)
   - Add streak indicator widget
   - Add XP/level progress card
   - Show recent achievements

2. **Profile/Settings** (`src/features/settings`)
   - Add badge showcase section
   - Display user level and total points

3. **Notifications** (`src/features/notifications`)
   - Push streak reminders
   - Achievement unlocked notifications

4. **Item Actions** (throughout the app)
   - Trigger point awards on successful actions
   - Show "+X points" feedback

### 1.4 Data Models

#### TypeScript Types

```typescript
// src/features/gamification/types.ts

export interface UserProgress {
  readonly userId: string
  readonly totalPoints: number
  readonly currentLevel: number
  readonly pointsToNextLevel: number
  readonly levelProgressPercent: number
}

export interface Streak {
  readonly userId: string
  readonly currentStreak: number
  readonly longestStreak: number
  readonly lastActivityDate: string
  readonly streakType: 'daily' | 'weekly'
  readonly isActive: boolean
  readonly expiresAt: string | null
}

export type BadgeCategory = 
  | 'milestone'      // First donation, 10 items, etc.
  | 'streak'         // Streak achievements
  | 'impact'         // CO2 saved milestones
  | 'community'      // Helping others
  | 'special'        // Limited time or event badges

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: BadgeCategory
  readonly rarity: BadgeRarity
  readonly iconUrl: string
  readonly requirement: string
  readonly pointsAwarded: number
}

export interface UserBadge {
  readonly badge: Badge
  readonly earnedAt: string
  readonly isNew: boolean
}

export interface LeaderboardEntry {
  readonly rank: number
  readonly userId: string
  readonly displayName: string
  readonly avatarUrl: string | null
  readonly totalPoints: number
  readonly level: number
}

export interface PointTransaction {
  readonly id: string
  readonly userId: string
  readonly points: number
  readonly reason: string
  readonly actionType: string
  readonly actionId: string | null
  readonly createdAt: string
}
```

#### Backend Database Schema (Suggested)

```sql
-- User gamification progress
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User streaks
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  streak_type VARCHAR(20) NOT NULL, -- 'daily' | 'weekly'
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Badge definitions
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  icon_url VARCHAR(500),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER,
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  is_notified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

-- Point transactions (audit log)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  reason VARCHAR(200),
  action_type VARCHAR(50) NOT NULL,
  action_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.5 API Endpoints

```yaml
# Gamification API Endpoints

# Get user's gamification progress
GET /api/gamification/progress
Response:
  - totalPoints: number
  - currentLevel: number
  - pointsToNextLevel: number
  - levelProgressPercent: number

# Get user's current streaks
GET /api/gamification/streaks
Response:
  - streaks: Streak[]

# Get all badges (earned and available)
GET /api/gamification/badges
Query Params:
  - filter: 'all' | 'earned' | 'available'
  - category: BadgeCategory (optional)
Response:
  - badges: Badge[]
  - earnedBadges: UserBadge[]

# Get user's point history
GET /api/gamification/points/history
Query Params:
  - page: number
  - limit: number
Response:
  - transactions: PointTransaction[]
  - pagination: { page, limit, total }

# Get leaderboard (optional feature)
GET /api/gamification/leaderboard
Query Params:
  - scope: 'global' | 'local' | 'friends'
  - period: 'all_time' | 'monthly' | 'weekly'
  - limit: number
Response:
  - entries: LeaderboardEntry[]
  - currentUserRank: number

# Mark badge notification as seen
POST /api/gamification/badges/:badgeId/seen
```

### 1.6 Frontend Implementation

#### API Module

```typescript
// src/features/gamification/api/gamificationApi.ts

import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import type { UserProgress, Streak, Badge, UserBadge, PointTransaction } from '../types'

export async function fetchUserProgress(): Promise<UserProgress> {
  const response = await apiRequest<unknown>('/gamification/progress')
  return unwrapApiData<UserProgress>(response)
}

export async function fetchStreaks(): Promise<Streak[]> {
  const response = await apiRequest<unknown>('/gamification/streaks')
  return unwrapApiData<Streak[]>(response)
}

export async function fetchBadges(filter: 'all' | 'earned' | 'available' = 'all'): Promise<{
  badges: Badge[]
  earnedBadges: UserBadge[]
}> {
  const response = await apiRequest<unknown>(`/gamification/badges?filter=${filter}`)
  return unwrapApiData<{ badges: Badge[]; earnedBadges: UserBadge[] }>(response)
}

export async function fetchPointHistory(page: number = 1, limit: number = 20): Promise<{
  transactions: PointTransaction[]
  pagination: { page: number; limit: number; total: number }
}> {
  const response = await apiRequest<unknown>(
    `/gamification/points/history?page=${page}&limit=${limit}`
  )
  return unwrapApiData<{
    transactions: PointTransaction[]
    pagination: { page: number; limit: number; total: number }
  }>(response)
}

export async function markBadgeSeen(badgeId: string): Promise<void> {
  await apiRequest<void>(`/gamification/badges/${badgeId}/seen`, { method: 'POST' })
}
```

#### Hook Example

```typescript
// src/features/gamification/hooks/useUserProgress.ts

import { useCallback, useEffect, useState } from 'react'
import { fetchUserProgress } from '../api/gamificationApi'
import type { UserProgress } from '../types'

interface UseUserProgressResult {
  progress: UserProgress | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUserProgress(): UseUserProgressResult {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchUserProgress()
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  return { progress, isLoading, error, refresh: loadProgress }
}
```

#### Component Example

```typescript
// src/features/gamification/ui/components/StreakIndicator.tsx

import { Flame } from 'lucide-react'
import type { Streak } from '../../types'

interface StreakIndicatorProps {
  readonly streak: Streak
  readonly size?: 'sm' | 'md' | 'lg'
}

export function StreakIndicator({ streak, size = 'md' }: StreakIndicatorProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-2',
    lg: 'text-xl gap-2',
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]}`}>
      <Flame
        size={iconSizes[size]}
        className={streak.isActive ? 'text-orange-500' : 'text-slate-400'}
        fill={streak.isActive ? 'currentColor' : 'none'}
      />
      <span className="font-semibold">
        {streak.currentStreak}
      </span>
      <span className="text-slate-500">
        {streak.streakType === 'daily' ? 'day' : 'week'}
        {streak.currentStreak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
```

### 1.7 Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Create `features/gamification` directory structure
- [ ] Define TypeScript types
- [ ] Implement API client functions
- [ ] Create basic hooks (useUserProgress, useStreaks, useBadges)
- [ ] **Backend**: Create database schema and basic endpoints

#### Phase 2: Core UI Components (Week 3-4)
- [ ] StreakIndicator component
- [ ] LevelBadge component
- [ ] ProgressBar component
- [ ] BadgeCard and BadgeGrid components
- [ ] AchievementUnlocked modal/toast

#### Phase 3: Dashboard Integration (Week 5)
- [ ] Add gamification card to Dashboard
- [ ] Integrate streak indicator in header/shell
- [ ] Add points earned toast on actions

#### Phase 4: Profile & Settings (Week 6)
- [ ] Badge showcase on profile
- [ ] Full gamification dashboard page
- [ ] Point history view

#### Phase 5: Notifications & Polish (Week 7)
- [ ] Streak reminder notifications
- [ ] Achievement unlock notifications
- [ ] Animation and polish
- [ ] Testing and bug fixes

---

## 2. Neighborhood Found Items

### 2.1 Feature Overview

This feature allows users to post items they discover in their neighborhood (abandoned furniture, lost items, etc.) that others in the community can opt to pick up. This extends TruCycle's mission by enabling community-driven waste reduction.

**Core Workflow:**

1. User finds an item in their neighborhood
2. User takes a photo using TruCycle app
3. User posts the item with location and description
4. Community members can see found items nearby
5. Interested users can "claim" the found item
6. Original poster marks item as picked up

### 2.2 User Stories

#### Posting Found Items
- As a user, I want to take a photo of a found item and post it quickly
- As a user, I want to add a description and approximate location
- As a user, I want to specify if the item is "curb alert" style (anyone can take)
- As a user, I want to track items I've posted and their status

#### Browsing Found Items
- As a user, I want to see found items near my location
- As a user, I want to filter found items by category or distance
- As a user, I want to express interest in picking up a found item
- As a user, I want to see how long ago an item was posted

#### Managing Found Items
- As the poster, I want to mark an item as "gone" when picked up
- As the poster, I want to delete my post if the item is no longer there
- As a user, I want to report inappropriate or inaccurate posts

### 2.3 Technical Architecture

#### Frontend Structure (Feature-First Pattern)

```
src/features/found-items/
├── api/
│   └── foundItemsApi.ts         # API calls for found items
├── hooks/
│   ├── useFoundItems.ts         # Hook for browsing found items
│   ├── useMyFoundPosts.ts       # Hook for user's posted items
│   └── useFoundItemDetails.ts   # Hook for single item details
├── types.ts                     # Found items types
├── ui/
│   ├── components/
│   │   ├── FoundItemCard.tsx        # Card for browsing view
│   │   ├── FoundItemDetails.tsx     # Full item details view
│   │   ├── PostFoundItemForm.tsx    # Form for posting new items
│   │   ├── CameraCapture.tsx        # Camera interface for photos
│   │   ├── LocationPicker.tsx       # Map/location input
│   │   ├── FoundItemsFilter.tsx     # Filter controls
│   │   └── FoundItemStatusBadge.tsx # Status indicator
│   ├── FoundItemsPage.tsx           # Main browse page
│   ├── PostFoundItemPage.tsx        # Post new item page
│   └── MyFoundPostsPage.tsx         # User's posted items
└── utils/
    └── locationUtils.ts             # Geolocation helpers
```

#### Integration Points

1. **App Shell** (`src/app/shell`)
   - Add "Post Found Item" quick action (camera FAB)
   - Add navigation link to Found Items section

2. **Dashboard** (`src/features/home/ui/Dashboard.tsx`)
   - Add "Found Items Nearby" widget (optional)
   - Quick stats on community impact

3. **Navigation/Routes** (`src/app/routes/AppRoutes.tsx`)
   - Add `/found-items` route (browse)
   - Add `/found-items/post` route (create)
   - Add `/found-items/my-posts` route (manage)

4. **Gamification Integration**
   - Award points for posting found items
   - Award points for successfully picked up items
   - Special "Good Samaritan" badge category

### 2.4 Data Models

#### TypeScript Types

```typescript
// src/features/found-items/types.ts

export type FoundItemStatus = 
  | 'available'    // Item is still there
  | 'claimed'      // Someone expressed interest
  | 'picked_up'    // Item was taken
  | 'expired'      // Item post expired/removed
  | 'reported'     // Item flagged for review

export type FoundItemCategory = 
  | 'furniture'
  | 'electronics'
  | 'clothing'
  | 'books'
  | 'appliances'
  | 'outdoor'
  | 'toys'
  | 'other'

export interface FoundItemImage {
  readonly url: string
  readonly thumbnailUrl: string
  readonly altText: string | null
}

export interface FoundItemLocation {
  readonly latitude: number
  readonly longitude: number
  readonly address: string | null
  readonly neighborhood: string | null
  readonly postcode: string
  readonly approximateDistance: number | null // in km, from user's location
}

export interface FoundItem {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: FoundItemCategory
  readonly status: FoundItemStatus
  readonly images: readonly FoundItemImage[]
  readonly location: FoundItemLocation
  readonly condition: string | null
  readonly poster: {
    readonly id: string
    readonly name: string
    readonly avatarUrl: string | null
  }
  readonly postedAt: string
  readonly expiresAt: string | null
  readonly claimCount: number
  readonly viewCount: number
}

export interface FoundItemClaim {
  readonly id: string
  readonly foundItemId: string
  readonly claimerId: string
  readonly claimerName: string
  readonly message: string | null
  readonly status: 'pending' | 'acknowledged' | 'completed' | 'cancelled'
  readonly createdAt: string
}

export interface CreateFoundItemPayload {
  readonly title: string
  readonly description: string
  readonly category: FoundItemCategory
  readonly condition?: string
  readonly images: readonly {
    readonly url: string
    readonly altText?: string
  }[]
  readonly location: {
    readonly latitude: number
    readonly longitude: number
    readonly address?: string
    readonly postcode: string
  }
}

export interface FoundItemsFilter {
  readonly category?: FoundItemCategory
  readonly status?: FoundItemStatus
  readonly maxDistance?: number // in km
  readonly postcode?: string
  readonly sortBy?: 'newest' | 'nearest' | 'popular'
}
```

#### Backend Database Schema (Suggested)

```sql
-- Found items
CREATE TABLE found_items (
  id UUID PRIMARY KEY,
  poster_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address VARCHAR(500),
  neighborhood VARCHAR(100),
  postcode VARCHAR(20),
  view_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Found item images
CREATE TABLE found_item_images (
  id UUID PRIMARY KEY,
  found_item_id UUID REFERENCES found_items(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  alt_text VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Found item claims (expressions of interest)
CREATE TABLE found_item_claims (
  id UUID PRIMARY KEY,
  found_item_id UUID REFERENCES found_items(id) ON DELETE CASCADE,
  claimer_id UUID REFERENCES users(id),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(found_item_id, claimer_id)
);

-- Found item reports (moderation)
CREATE TABLE found_item_reports (
  id UUID PRIMARY KEY,
  found_item_id UUID REFERENCES found_items(id),
  reporter_id UUID REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for location-based queries
CREATE INDEX idx_found_items_location ON found_items 
  USING gist (ll_to_earth(latitude, longitude));
```

### 2.5 API Endpoints

```yaml
# Found Items API Endpoints

# Get found items (with filters)
GET /api/found-items
Query Params:
  - category: FoundItemCategory (optional)
  - status: FoundItemStatus (default: 'available')
  - postcode: string (optional, for location-based search)
  - latitude: number (optional)
  - longitude: number (optional)
  - maxDistance: number (in km, default: 5)
  - sortBy: 'newest' | 'nearest' | 'popular'
  - page: number
  - limit: number
Response:
  - items: FoundItem[]
  - pagination: { page, limit, total }

# Get single found item details
GET /api/found-items/:id
Response:
  - item: FoundItem
  - claims: FoundItemClaim[] (only if poster)

# Create found item
POST /api/found-items
Body: CreateFoundItemPayload
Response:
  - item: FoundItem

# Update found item status
PATCH /api/found-items/:id/status
Body:
  - status: FoundItemStatus
Response:
  - item: FoundItem

# Delete found item
DELETE /api/found-items/:id
Response:
  - success: boolean

# Get my posted found items
GET /api/found-items/my-posts
Query Params:
  - status: FoundItemStatus (optional)
  - page: number
  - limit: number
Response:
  - items: FoundItem[]
  - pagination: { page, limit, total }

# Express interest in found item
POST /api/found-items/:id/claim
Body:
  - message: string (optional)
Response:
  - claim: FoundItemClaim

# Cancel interest
DELETE /api/found-items/:id/claim
Response:
  - success: boolean

# Report found item
POST /api/found-items/:id/report
Body:
  - reason: string
  - details: string (optional)
Response:
  - success: boolean

# Upload image for found item
POST /api/found-items/upload
Content-Type: multipart/form-data
Body:
  - image: File
Response:
  - url: string
  - thumbnailUrl: string
```

### 2.6 Frontend Implementation

#### API Module

```typescript
// src/features/found-items/api/foundItemsApi.ts

import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import type { 
  FoundItem, 
  FoundItemsFilter, 
  CreateFoundItemPayload,
  FoundItemStatus,
  FoundItemClaim 
} from '../types'
import type { PaginationMeta } from '@/shared/types/pagination'

interface FoundItemsResponse {
  items: FoundItem[]
  pagination: PaginationMeta
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export async function fetchFoundItems(
  filters: FoundItemsFilter = {},
  page: number = 1,
  limit: number = 20
): Promise<FoundItemsResponse> {
  const query = buildQueryString({
    category: filters.category,
    status: filters.status ?? 'available',
    postcode: filters.postcode,
    maxDistance: filters.maxDistance,
    sortBy: filters.sortBy ?? 'newest',
    page,
    limit,
  })
  
  const response = await apiRequest<unknown>(`/found-items${query}`)
  return unwrapApiData<FoundItemsResponse>(response)
}

export async function fetchFoundItemById(id: string): Promise<{
  item: FoundItem
  claims: FoundItemClaim[]
}> {
  const response = await apiRequest<unknown>(`/found-items/${id}`)
  return unwrapApiData<{ item: FoundItem; claims: FoundItemClaim[] }>(response)
}

export async function fetchMyFoundPosts(
  status?: FoundItemStatus,
  page: number = 1,
  limit: number = 20
): Promise<FoundItemsResponse> {
  const query = buildQueryString({ status, page, limit })
  const response = await apiRequest<unknown>(`/found-items/my-posts${query}`)
  return unwrapApiData<FoundItemsResponse>(response)
}

export async function createFoundItem(payload: CreateFoundItemPayload): Promise<FoundItem> {
  const response = await apiRequest<unknown>('/found-items', {
    method: 'POST',
    body: payload,
  })
  return unwrapApiData<{ item: FoundItem }>(response).item
}

export async function updateFoundItemStatus(
  id: string, 
  status: FoundItemStatus
): Promise<FoundItem> {
  const response = await apiRequest<unknown>(`/found-items/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return unwrapApiData<{ item: FoundItem }>(response).item
}

export async function deleteFoundItem(id: string): Promise<void> {
  await apiRequest<void>(`/found-items/${id}`, { method: 'DELETE' })
}

export async function claimFoundItem(id: string, message?: string): Promise<FoundItemClaim> {
  const response = await apiRequest<unknown>(`/found-items/${id}/claim`, {
    method: 'POST',
    body: { message },
  })
  return unwrapApiData<{ claim: FoundItemClaim }>(response).claim
}

export async function cancelFoundItemClaim(id: string): Promise<void> {
  await apiRequest<void>(`/found-items/${id}/claim`, { method: 'DELETE' })
}

export async function reportFoundItem(
  id: string, 
  reason: string, 
  details?: string
): Promise<void> {
  await apiRequest<void>(`/found-items/${id}/report`, {
    method: 'POST',
    body: { reason, details },
  })
}

export async function uploadFoundItemImage(file: File): Promise<{
  url: string
  thumbnailUrl: string
}> {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await fetch('/api/found-items/upload', {
    method: 'POST',
    body: formData,
    // Note: Don't set Content-Type header - browser sets it with boundary
  })
  
  if (!response.ok) {
    throw new Error('Image upload failed')
  }
  
  return response.json()
}
```

#### Hook Example

```typescript
// src/features/found-items/hooks/useFoundItems.ts

import { useCallback, useEffect, useState } from 'react'
import { fetchFoundItems } from '../api/foundItemsApi'
import type { FoundItem, FoundItemsFilter } from '../types'
import type { PaginationMeta } from '@/shared/types/pagination'

interface UseFoundItemsResult {
  items: FoundItem[]
  pagination: PaginationMeta | null
  isLoading: boolean
  error: string | null
  filters: FoundItemsFilter
  updateFilters: (updates: Partial<FoundItemsFilter>) => void
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useFoundItems(
  initialFilters: FoundItemsFilter = {}
): UseFoundItemsResult {
  const [items, setItems] = useState<FoundItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [filters, setFilters] = useState<FoundItemsFilter>(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchFoundItems(filters, page)
      
      if (append) {
        setItems(prev => [...prev, ...response.items])
      } else {
        setItems(response.items)
      }
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const updateFilters = useCallback((updates: Partial<FoundItemsFilter>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }, [])

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= Math.ceil(pagination.total / pagination.limit)) {
      return
    }
    await loadItems(pagination.page + 1, true)
  }, [pagination, loadItems])

  const refresh = useCallback(async () => {
    await loadItems()
  }, [loadItems])

  return {
    items,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    loadMore,
    refresh,
  }
}
```

#### Component Examples

```typescript
// src/features/found-items/ui/components/FoundItemCard.tsx

import { Clock, MapPin, Eye, Users } from 'lucide-react'
import type { FoundItem } from '../../types'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'
import { formatDistanceToNow } from '@/shared/utils/dateUtils'

interface FoundItemCardProps {
  readonly item: FoundItem
  readonly onClick?: () => void
}

export function FoundItemCard({ item, onClick }: FoundItemCardProps) {
  const primaryImage = item.images[0]
  
  return (
    <button
      type="button"
      className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:shadow-md"
      onClick={onClick}
    >
      {primaryImage ? (
        <img 
          src={primaryImage.thumbnailUrl || primaryImage.url} 
          alt={item.title}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
          No image
        </div>
      )}
      
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 line-clamp-1">{item.title}</h3>
          <FoundItemStatusBadge status={item.status} />
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
        
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {item.location.neighborhood || item.location.postcode}
            {item.location.approximateDistance && (
              <span>• {item.location.approximateDistance.toFixed(1)} km</span>
            )}
          </span>
          
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(item.postedAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {item.viewCount} views
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {item.claimCount} interested
          </span>
        </div>
      </div>
    </button>
  )
}
```

```typescript
// src/features/found-items/ui/components/CameraCapture.tsx

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Upload, X, RotateCw } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'

interface CameraCaptureProps {
  readonly onCapture: (file: File) => void
  readonly onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
      }
      setError(null)
    } catch {
      setError('Unable to access camera. Please allow camera permissions.')
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `found-item-${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopCamera()
        onCapture(file)
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera, onCapture])

  const switchCamera = useCallback(() => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }, [stopCamera])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
    }
  }, [onCapture])

  // Start camera on mount
  useEffect(() => {
    void startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  return (
    <div className="relative h-full w-full bg-black">
      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-white">
          <p className="text-center">{error}</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Upload Photo Instead
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-white/20 p-3 backdrop-blur"
            >
              <X size={24} className="text-white" />
            </button>
            
            <button
              type="button"
              onClick={capturePhoto}
              className="rounded-full bg-white p-4"
            >
              <Camera size={32} className="text-slate-900" />
            </button>
            
            <button
              type="button"
              onClick={switchCamera}
              className="rounded-full bg-white/20 p-3 backdrop-blur"
            >
              <RotateCw size={24} className="text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

### 2.7 Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Create `features/found-items` directory structure
- [ ] Define TypeScript types
- [ ] Implement API client functions
- [ ] Create basic hooks
- [ ] **Backend**: Create database schema and basic endpoints
- [ ] Add routes to AppRoutes.tsx

#### Phase 2: Camera & Image Upload (Week 3)
- [ ] CameraCapture component with permissions handling
- [ ] Image upload integration with Cloudinary or similar
- [ ] Image preview and editing (crop/rotate)
- [ ] Multiple image support

#### Phase 3: Posting Flow (Week 4)
- [ ] PostFoundItemForm component
- [ ] Location detection (GPS) with fallback to manual entry
- [ ] LocationPicker with map integration (optional)
- [ ] Form validation and error handling

#### Phase 4: Browse & Details (Week 5)
- [ ] FoundItemsPage with filters
- [ ] FoundItemCard and grid layout
- [ ] FoundItemDetails modal/page
- [ ] Claim/interest functionality

#### Phase 5: My Posts Management (Week 6)
- [ ] MyFoundPostsPage
- [ ] Status update actions
- [ ] Delete functionality
- [ ] Claims management (for posters)

#### Phase 6: Integration & Polish (Week 7)
- [ ] Quick-post FAB button in shell
- [ ] Dashboard widget (optional)
- [ ] Notifications for claims
- [ ] Gamification integration (points for posting)
- [ ] Testing and bug fixes

---

## 3. Cross-Feature Considerations

### 3.1 Shared Dependencies

Both features will benefit from:

1. **Geolocation utilities** - Create `shared/utils/geolocation.ts` for location handling
2. **Date formatting** - Extend `shared/utils/dateUtils.ts` for relative time display
3. **Image handling** - Standardize image upload/display patterns in `shared/lib/`
4. **Toast notifications** - Use existing toast system for feedback

### 3.2 Navigation Updates

Add new navigation items to the app shell:

```typescript
// Suggested navigation additions
{
  label: 'Found Items',
  icon: MapPinIcon,
  path: '/found-items',
  badge: unreadFoundItemsCount // optional
},
{
  label: 'Achievements',
  icon: TrophyIcon,
  path: '/achievements',
}
```

### 3.3 Gamification + Found Items Integration

Link the features:

| Action | Points | Badge Potential |
|--------|--------|-----------------|
| Post first found item | 50 | "Good Samaritan" badge |
| Post 10 found items | 200 | "Neighborhood Scout" badge |
| Have 5 items picked up | 150 | "Community Helper" badge |
| Claim a found item | 25 | - |
| Mark item as picked up | 30 | - |

### 3.4 Backend Coordination

Both features require backend support. Coordinate with backend team on:

1. Database migrations sequencing
2. API versioning strategy
3. Real-time updates (WebSocket integration for notifications)
4. Rate limiting for posts/uploads
5. Moderation tools for found items

---

## 4. Risk Assessment & Mitigation

### 4.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Camera API browser compatibility | High | Medium | Provide file upload fallback; test across browsers |
| Geolocation accuracy | Medium | Medium | Allow manual location correction; use approximate display |
| Image storage costs | Medium | Low | Implement image size limits; use compression; set retention policy |
| Performance with many found items | Medium | Medium | Implement pagination, virtualization, and caching |

### 4.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Abuse of found items feature | High | Medium | Implement reporting; rate limit posts; require verification |
| Privacy concerns with location | High | Medium | Display approximate locations; educate users; provide controls |
| Gamification becoming annoying | Medium | Low | Allow opt-out; keep notifications subtle; respect user preferences |
| Outdated found item posts | Medium | High | Implement auto-expiry (e.g., 7 days); prompt for status updates |

### 4.3 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption of found items | Medium | Medium | Promote feature; seed with content; integrate with existing flows |
| Gaming the points system | Low | Medium | Implement cooldowns; cap daily points; audit suspicious activity |

---

## 5. Success Metrics

### 5.1 Gamification Metrics

| Metric | Target (3 months) | Target (6 months) |
|--------|-------------------|-------------------|
| Users with active streaks | 30% of active users | 50% of active users |
| Average streak length | 5 days | 10 days |
| Users with 3+ badges | 40% of active users | 60% of active users |
| Daily active users increase | +15% | +25% |
| User retention (30-day) | +10% | +20% |

### 5.2 Found Items Metrics

| Metric | Target (3 months) | Target (6 months) |
|--------|-------------------|-------------------|
| Found items posted | 500 | 2,000 |
| Found items picked up | 200 | 1,000 |
| Pickup rate | 40% | 50% |
| Active found item posters | 200 users | 800 users |
| Avg time to pickup | < 48 hours | < 24 hours |

### 5.3 Combined Impact

| Metric | Target |
|--------|--------|
| Community waste diverted | +20% |
| User engagement (sessions/week) | +30% |
| Net Promoter Score | +10 points |

---

## 6. Timeline Estimate

### Overview (14-week implementation)

```
Week 1-2:   Gamification Foundation + Found Items Foundation
Week 3-4:   Gamification Core UI + Camera/Upload
Week 5:     Dashboard Integration + Posting Flow
Week 6:     Profile/Settings + Browse & Details
Week 7:     Gamification Polish + My Posts Management
Week 8-9:   Integration & Cross-feature work
Week 10:    Testing (unit, integration, E2E)
Week 11:    Bug fixes and performance optimization
Week 12:    Beta release to subset of users
Week 13:    Iterate based on feedback
Week 14:    Full release
```

### Resource Requirements

| Role | Allocation |
|------|------------|
| Frontend Developer(s) | 1-2 full-time |
| Backend Developer(s) | 1 full-time |
| Designer | 0.5 (initial designs, then support) |
| QA | 0.5 (ramping up in week 10) |
| Product Manager | 0.25 (prioritization, feedback loops) |

---

## Appendix A: UI/UX Mockup Suggestions

### Gamification Dashboard Widget

```
┌─────────────────────────────────────────────┐
│  🔥 7 Day Streak!              Level 12     │
│  ════════════════════════░░░░░░░░░░░░░░░░░  │
│  3,450 XP • 550 to Level 13                 │
├─────────────────────────────────────────────┤
│  Recent Badges:                             │
│  [🌟] [🎯] [🌱] [+3 more]                   │
│                                             │
│            [View All Achievements]          │
└─────────────────────────────────────────────┘
```

### Found Item Card

```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │         [Item Photo]                │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Wooden Coffee Table          [Available]   │
│  Good condition, minor scratches            │
│                                             │
│  📍 East Village • 0.3 km                   │
│  🕐 Posted 2 hours ago                      │
│                                             │
│  👁 45 views • 👥 3 interested              │
│                                             │
│        [I'll Pick This Up]                  │
└─────────────────────────────────────────────┘
```

---

## Appendix B: Badge Ideas

### Milestone Badges
- 🌱 **First Steps** - Complete your first exchange
- 🎯 **Getting Started** - List 5 items
- ⭐ **Rising Star** - Complete 10 exchanges
- 💫 **Exchange Pro** - Complete 50 exchanges
- 🏆 **TruCycler Elite** - Complete 100 exchanges

### Streak Badges
- 🔥 **Warming Up** - Maintain a 3-day streak
- 🔥🔥 **On Fire** - Maintain a 7-day streak
- 🔥🔥🔥 **Unstoppable** - Maintain a 30-day streak
- 💎 **Diamond Consistency** - Maintain a 100-day streak

### Impact Badges
- 🌍 **Earth Saver** - Save 10 kg of CO2
- 🌳 **Forest Friend** - Save 50 kg of CO2
- 🌏 **Climate Champion** - Save 200 kg of CO2

### Community Badges (Found Items)
- 🔍 **Good Samaritan** - Post your first found item
- 🏘️ **Neighborhood Scout** - Post 10 found items
- 🤝 **Community Helper** - Have 5 found items picked up
- 📸 **Sharp Eye** - Post 25 found items

### Special Badges
- 🎄 **Holiday Hero** - Complete exchanges during holiday season
- 🌈 **Early Bird** - Be among the first 100 users
- 📱 **App Explorer** - Use all app features

---

*Document Version: 1.0*
*Last Updated: April 2026*
*Author: TruCycle Engineering Team*
