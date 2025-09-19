'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InlineEditor } from './inline-editor'
import { ContextMenu, QuickActionButton } from './context-menu'
import { StatusIndicator, StatusDot } from './status-indicator'

// Types for calendar data
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: Date
  time?: string
  status: 'draft' | 'pending' | 'approved' | 'published' | 'error'
  type: 'post' | 'story' | 'reel' | 'campaign'
  thumbnail?: string
  platform?: string[]
  clientId?: string
}

export type CalendarView = 'month' | 'week' | 'day'

interface CalendarViewProps {
  events?: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onEventDrop?: (eventId: string, newDate: Date) => void
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void
  onEventDuplicate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
  onDateClick?: (date: Date) => void
  className?: string
}

// Status color mapping
const statusColors = {
  draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  pending: 'bg-warning-50 text-warning-700 border-warning-200',
  approved: 'bg-success-50 text-success-700 border-success-200',
  published: 'bg-primary-50 text-primary-700 border-primary-200',
  error: 'bg-error-50 text-error-700 border-error-200',
}

// Type color mapping
const typeColors = {
  post: 'bg-info-500',
  story: 'bg-purple-500',
  reel: 'bg-pink-500',
  campaign: 'bg-orange-500',
}

export function CalendarView({ 
  events = [], 
  onEventClick, 
  onEventDrop, 
  onEventUpdate,
  onEventDuplicate,
  onEventDelete,
  onDateClick,
  className 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    event: CalendarEvent
    position: { x: number; y: number }
  } | null>(null)

  // Generate calendar dates for current view
  const calendarDates = useMemo(() => {
    const dates: Date[] = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (view === 'month') {
      // Get first day of month and calculate start of calendar grid
      const firstDay = new Date(year, month, 1)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        dates.push(date)
      }
    } else if (view === 'week') {
      // Get start of week
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        dates.push(date)
      }
    } else {
      // Day view - just current date
      dates.push(new Date(currentDate))
    }

    return dates
  }, [currentDate, view])

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }, [events])

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, view])

  const navigateNext = useCallback(() => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }, [currentDate, view])

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', event.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedEvent && onEventDrop) {
      onEventDrop(draggedEvent.id, date)
    }
    setDraggedEvent(null)
    setHoveredDate(null)
  }

  const handleDragEnter = (date: Date) => {
    setHoveredDate(date)
  }

  const handleDragLeave = () => {
    setHoveredDate(null)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    if (view === 'month') {
      return date.getDate().toString()
    } else if (view === 'week') {
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  // Get header title
  const getHeaderTitle = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
    } else {
      return formatDate(currentDate)
    }
  }

  return (
    <div className={cn("bg-white rounded-xl border border-neutral-200 shadow-sm", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            {getHeaderTitle()}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
            className="text-sm"
          >
            Hoy
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Mes
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-8 px-3"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Día
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={navigatePrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {view === 'month' && (
          <MonthView
            dates={calendarDates}
            currentDate={currentDate}
            events={events}
            getEventsForDate={getEventsForDate}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            draggedEvent={draggedEvent}
            hoveredDate={hoveredDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            editingEvent={editingEvent}
            onStartEdit={setEditingEvent}
            onEventUpdate={onEventUpdate}
            onContextMenu={setContextMenu}
          />
        )}

        {view === 'week' && (
          <WeekView
            dates={calendarDates}
            currentDate={currentDate}
            events={events}
            getEventsForDate={getEventsForDate}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            draggedEvent={draggedEvent}
            hoveredDate={hoveredDate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            editingEvent={editingEvent}
            onStartEdit={setEditingEvent}
            onEventUpdate={onEventUpdate}
            onContextMenu={setContextMenu}
          />
        )}

        {view === 'day' && (
          <DayView
            date={currentDate}
            events={getEventsForDate(currentDate)}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            draggedEvent={draggedEvent}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            editingEvent={editingEvent}
            onStartEdit={setEditingEvent}
            onEventUpdate={onEventUpdate}
            onContextMenu={setContextMenu}
          />
        )}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            event={contextMenu.event}
            isOpen={true}
            onClose={() => setContextMenu(null)}
            onEdit={() => setEditingEvent(contextMenu.event.id)}
            onDuplicate={() => onEventDuplicate?.(contextMenu.event)}
            onDelete={() => onEventDelete?.(contextMenu.event.id)}
            onChangeStatus={(status) => onEventUpdate?.(contextMenu.event.id, { status })}
            onSchedule={() => console.log('Schedule:', contextMenu.event.id)}
            onPreview={() => console.log('Preview:', contextMenu.event.id)}
            onShare={() => console.log('Share:', contextMenu.event.id)}
            position={contextMenu.position}
          />
        )}
      </div>
    </div>
  )
}

// Month View Component
interface MonthViewProps {
  dates: Date[]
  currentDate: Date
  events: CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  draggedEvent: CalendarEvent | null
  hoveredDate: Date | null
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, date: Date) => void
  onDragEnter: (date: Date) => void
  onDragLeave: () => void
  editingEvent: string | null
  onStartEdit: (eventId: string) => void
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void
  onContextMenu: (menu: { event: CalendarEvent; position: { x: number; y: number } }) => void
}

function MonthView({
  dates,
  currentDate,
  getEventsForDate,
  onEventClick,
  onDateClick,
  draggedEvent,
  hoveredDate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  editingEvent,
  onStartEdit,
  onEventUpdate,
  onContextMenu,
}: MonthViewProps) {
  const today = new Date()
  const currentMonth = currentDate.getMonth()

  return (
    <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden">
      {/* Week day headers */}
      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
        <div
          key={day}
          className="bg-neutral-50 p-3 text-center text-sm font-medium text-neutral-600"
        >
          {day}
        </div>
      ))}

      {/* Calendar dates */}
      {dates.map((date, index) => {
        const dayEvents = getEventsForDate(date)
        const isToday = date.toDateString() === today.toDateString()
        const isCurrentMonth = date.getMonth() === currentMonth
        const isHovered = hoveredDate?.toDateString() === date.toDateString()

        return (
          <motion.div
            key={index}
            className={cn(
              "bg-white min-h-[120px] p-2 cursor-pointer transition-colors",
              !isCurrentMonth && "bg-neutral-50 text-neutral-400",
              isHovered && "bg-primary-50",
              isToday && "bg-primary-50 border-2 border-primary-200"
            )}
            onClick={() => onDateClick?.(date)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, date)}
            onDragEnter={() => onDragEnter(date)}
            onDragLeave={onDragLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-sm font-medium",
                isToday && "text-primary-700 font-semibold"
              )}>
                {date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <span className="text-xs text-neutral-500">
                  {dayEvents.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <AnimatePresence>
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    onDragStart={onDragStart}
                    isDragging={draggedEvent?.id === event.id}
                    size="small"
                    isEditing={editingEvent === event.id}
                    onStartEdit={onStartEdit}
                    onEventUpdate={onEventUpdate}
                    onContextMenu={onContextMenu}
                  />
                ))}
              </AnimatePresence>
              
              {dayEvents.length > 3 && (
                <div className="text-xs text-neutral-500 px-2 py-1">
                  +{dayEvents.length - 3} más
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Week View Component
function WeekView({
  dates,
  currentDate,
  getEventsForDate,
  onEventClick,
  onDateClick,
  draggedEvent,
  hoveredDate,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  editingEvent,
  onStartEdit,
  onEventUpdate,
  onContextMenu,
}: MonthViewProps) {
  const today = new Date()

  return (
    <div className="grid grid-cols-7 gap-4">
      {dates.map((date, index) => {
        const dayEvents = getEventsForDate(date)
        const isToday = date.toDateString() === today.toDateString()
        const isHovered = hoveredDate?.toDateString() === date.toDateString()

        return (
          <motion.div
            key={index}
            className={cn(
              "bg-white border border-neutral-200 rounded-lg p-4 min-h-[300px] cursor-pointer",
              isHovered && "bg-primary-50 border-primary-200",
              isToday && "bg-primary-50 border-primary-300"
            )}
            onClick={() => onDateClick?.(date)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, date)}
            onDragEnter={() => onDragEnter(date)}
            onDragLeave={onDragLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-center mb-4">
              <div className="text-sm text-neutral-600 font-medium">
                {date.toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
              <div className={cn(
                "text-lg font-semibold mt-1",
                isToday && "text-primary-700"
              )}>
                {date.getDate()}
              </div>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {dayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    onDragStart={onDragStart}
                    isDragging={draggedEvent?.id === event.id}
                    size="medium"
                    isEditing={editingEvent === event.id}
                    onStartEdit={onStartEdit}
                    onEventUpdate={onEventUpdate}
                    onContextMenu={onContextMenu}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Day View Component
interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  draggedEvent: CalendarEvent | null
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, date: Date) => void
  editingEvent: string | null
  onStartEdit: (eventId: string) => void
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void
  onContextMenu: (menu: { event: CalendarEvent; position: { x: number; y: number } }) => void
}

function DayView({
  date,
  events,
  onEventClick,
  onDateClick,
  draggedEvent,
  onDragStart,
  onDragOver,
  onDrop,
  editingEvent,
  onStartEdit,
  onEventUpdate,
  onContextMenu,
}: DayViewProps) {
  return (
    <div
      className="bg-white border border-neutral-200 rounded-lg p-6 min-h-[500px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, date)}
    >
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
              onDragStart={onDragStart}
              isDragging={draggedEvent?.id === event.id}
              size="large"
              isEditing={editingEvent === event.id}
              onStartEdit={onStartEdit}
              onEventUpdate={onEventUpdate}
              onContextMenu={onContextMenu}
            />
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <Calendar className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p>No hay eventos programados para este día</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => <span>onDateClick?.(date)}
            ></span><Plus className="h-4 w-4 mr-2" /> <span>Agregar evento</span></Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Event Card Component
interface EventCardProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void
  isDragging: boolean
  size: 'small' | 'medium' | 'large'
  isEditing: boolean
  onStartEdit: (eventId: string) => void
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => void
  onContextMenu: (menu: { event: CalendarEvent; position: { x: number; y: number } }) => void
}

function EventCard({ 
  event, 
  onClick, 
  onDragStart, 
  isDragging, 
  size, 
  isEditing,
  onStartEdit,
  onEventUpdate,
  onContextMenu 
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu({
      event,
      position: { x: e.clientX, y: e.clientY }
    })
  }

  const handleTitleUpdate = (newTitle: string) => {
    onEventUpdate?.(event.id, { title: newTitle })
  }

  const handleDescriptionUpdate = (newDescription: string) => {
    onEventUpdate?.(event.id, { description: newDescription })
  }

  return (
    <motion.div
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && onDragStart(e as any, event)}
      onClick={() => !isEditing && onClick?.(event)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative cursor-pointer rounded-md border transition-all duration-200",
        statusColors[event.status],
        isDragging && "opacity-50 scale-95",
        isEditing && "ring-2 ring-primary-500 ring-opacity-50",
        size === 'small' && "p-2",
        size === 'medium' && "p-3",
        size === 'large' && "p-4"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: isEditing ? 1 : 1.02 }}
      transition={{ duration: 0.15 }}
    >
      {/* Type indicator */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-md",
        typeColors[event.type]
      )} />

      <div className="ml-2 flex-1">
        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-1">
          <StatusDot status={event.status} size="sm" />
          <div className="flex items-center gap-1">
            <QuickActionButton
              event={event}
              onContextMenu={handleContextMenu}
              className="opacity-0 group-hover:opacity-100"
            />
          </div>
        </div>

        {/* Title */}
        <div className={cn(
          "font-medium",
          size === 'small' && "text-xs",
          size === 'medium' && "text-sm",
          size === 'large' && "text-base"
        )}>
          {isEditing && size !== 'small' ? (
            <InlineEditor
              value={event.title}
              onSave={handleTitleUpdate}
              onCancel={() => onStartEdit('')}
              isEditing={true}
              placeholder="Título del evento"
            />
          ) : (
            <div 
              className="truncate cursor-pointer"
              onDoubleClick={() => size !== 'small' && onStartEdit(event.id)}
            >
              {event.title}
            </div>
          )}
        </div>
        
        {size !== 'small' && event.time && (
          <div className="text-xs text-neutral-500 mt-1">
            {event.time}
          </div>
        )}
        
        {size === 'large' && (
          <div className="text-sm text-neutral-600 mt-2">
            {isEditing ? (
              <InlineEditor
                value={event.description || ''}
                onSave={handleDescriptionUpdate}
                onCancel={() => onStartEdit('')}
                isEditing={true}
                placeholder="Descripción del evento"
                multiline={true}
              />
            ) : (
              <div 
                className="line-clamp-2 cursor-pointer"
                onDoubleClick={() => onStartEdit(event.id)}
              >
                {event.description || 'Sin descripción'}
              </div>
            )}
          </div>
        )}

        {size !== 'small' && event.platform && (
          <div className="flex gap-1 mt-2">
            {event.platform.slice(0, 3).map((platform) => (
              <span
                key={platform}
                className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover preview */}
      <AnimatePresence>
        {isHovered && size === 'small' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-10 left-full ml-2 top-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 w-64"
          >
            <div className="font-medium text-sm">{event.title}</div>
            {event.time && (
              <div className="text-xs text-neutral-500 mt-1">{event.time}</div>
            )}
            {event.description && (
              <div className="text-sm text-neutral-600 mt-2">{event.description}</div>
            )}
            {event.thumbnail && (
              <img
                src={event.thumbnail}
                alt={event.title}
                className="w-full h-24 object-cover rounded mt-2"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}