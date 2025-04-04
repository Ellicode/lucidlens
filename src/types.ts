import type { Component } from 'vue'

export interface Article {
  id?: string | null
  title: string
  description: string
  image?: string
  headline?:
    | 'breaking'
    | 'trending'
    | 'latest'
    | 'analysis'
    | 'opinion'
    | 'review'
    | 'interview'
    | 'feature'
  timestamp: Date
  author?: string
  content?: string
  visible?: boolean
}

export interface User {
  id: string
  email: string
  displayName: string
  photoURL: string
  subscription: 'free' | 'premium'
  biography: string
  interests: string[]
  // Reading preferences
  fontSize: number
  font: 'sans-serif' | 'serif' | 'dyslexic'
}

export interface Suggestion {
  query: string
  prompt: string
  color: string
  icon: Component
}

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
  parentId?: string
  createdAt: Date
}
