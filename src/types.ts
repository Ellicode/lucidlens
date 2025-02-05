import type { Component } from 'vue'

export interface Article {
  id?: string | null
  title: string
  description: string
  image?: string
  tags: string[]
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
}

export interface User {
  id: string
  email: string
  displayName: string
  photoURL: string
  subscription: 'free' | 'premium'
}

export interface Suggestion {
  query: string
  prompt: string
  color: string
  icon: Component
}
