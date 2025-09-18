'use client'

import React, { useState } from 'react'
import { CalendarView, CalendarEvent } from '@/components/calendar/calendar-view'
import { StatusProgress } from '@/components/calendar/status-indicator'
import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'

// Mock data for testing - using current month dates
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Post de Instagram - Producto Nuevo',
    description: 'Lanzamiento del nuevo producto de verano con imágenes lifestyle',
    date: new Date(currentYear, currentMonth, 15, 10, 0),
    time: '10:00',
    status: 'approved',
    type: 'post',
    thumbnail: '/api/placeholder/300/200',
    platform: ['Instagram', 'Facebook'],
    clientId: 'client-1'
  },
  {
    id: '2',
    title: 'Story - Behind the Scenes',
    description: 'Video del proceso de creación en el estudio',
    date: new Date(currentYear, currentMonth, 16, 14, 30),
    time: '14:30',
    status: 'pending',
    type: 'story',
    platform: ['Instagram'],
    clientId: 'client-1'
  },
  {
    id: '3',
    title: 'Reel - Tutorial de Uso',
    description: 'Video tutorial mostrando cómo usar el producto',
    date: new Date(currentYear, currentMonth, 18, 9, 0),
    time: '09:00',
    status: 'draft',
    type: 'reel',
    platform: ['Instagram', 'TikTok'],
    clientId: 'client-2'
  },
  {
    id: '4',
    title: 'Campaña Black Friday',
    description: 'Serie de posts para la campaña de Black Friday',
    date: new Date(currentYear, currentMonth, 20, 8, 0),
    time: '08:00',
    status: 'published',
    type: 'campaign',
    platform: ['Instagram', 'Facebook', 'Twitter'],
    clientId: 'client-1'
  },
  {
    id: '5',
    title: 'Post Navideño',
    description: 'Contenido especial para las fiestas navideñas',
    date: new Date(currentYear, currentMonth, 22, 12, 0),
    time: '12:00',
    status: 'approved',
    type: 'post',
    platform: ['Instagram', 'Facebook'],
    clientId: 'client-3'
  },
  {
    id: '6',
    title: 'Story - Promoción Especial',
    description: 'Anuncio de promoción especial de fin de año',
    date: new Date(currentYear, currentMonth, 25, 16, 0),
    time: '16:00',
    status: 'error',
    type: 'story',
    platform: ['Instagram'],
    clientId: 'client-2'
  },
  {
    id: '7',
    title: 'Reel - Año Nuevo',
    description: 'Video de celebración de año nuevo',
    date: new Date(currentYear, currentMonth, 28, 11, 0),
    time: '11:00',
    status: 'draft',
    type: 'reel',
    platform: ['Instagram', 'TikTok'],
    clientId: 'client-1'
  },
  {
    id: '8',
    title: 'Post - Resumen del Año',
    description: 'Collage con los mejores momentos del año',
    date: new Date(currentYear, currentMonth, 30, 15, 0),
    time: '15:00',
    status: 'pending',
    type: 'post',
    platform: ['Instagram', 'Facebook', 'LinkedIn'],
    clientId: 'client-3'
  }
]

export default function CalendarDemoPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    console.log('Event clicked:', event)
  }

  const handleEventDrop = (eventId: string, newDate: Date) => {
    console.log('Event dropped:', eventId, 'to', newDate)
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, date: newDate }
          : event
      )
    )
  }

  const handleEventUpdate = (eventId: string, updates: Partial<CalendarEvent>) => {
    console.log('Event updated:', eventId, updates)
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { ...event, ...updates }
          : event
      )
    )
  }

  const handleEventDuplicate = (event: CalendarEvent) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `${event.id}-copy-${Date.now()}`,
      title: `${event.title} (Copia)`,
      date: new Date(event.date.getTime() + 24 * 60 * 60 * 1000) // Next day
    }
    setEvents(prevEvents => [...prevEvents, newEvent])
    console.log('Event duplicated:', newEvent)
  }

  const handleEventDelete = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId))
    console.log('Event deleted:', eventId)
  }

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // Here you could open a modal to create a new event
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Calendario de Publicaciones
              </h1>
              <p className="text-neutral-600">
                Gestiona y programa tu contenido de redes sociales con drag & drop
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
          onEventUpdate={handleEventUpdate}
          onEventDuplicate={handleEventDuplicate}
          onEventDelete={handleEventDelete}
          onDateClick={handleDateClick}
          className="mb-8"
        />

        {/* Event Details Panel */}
        {selectedEvent && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Detalles del Evento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Información General</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-neutral-500">Título:</span>
                    <span className="ml-2 text-neutral-900">{selectedEvent.title}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Descripción:</span>
                    <span className="ml-2 text-neutral-900">{selectedEvent.description}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Fecha:</span>
                    <span className="ml-2 text-neutral-900">
                      {selectedEvent.date.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Hora:</span>
                    <span className="ml-2 text-neutral-900">{selectedEvent.time}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Estado y Plataformas</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-neutral-500">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.status === 'published' ? 'bg-primary-100 text-primary-700' :
                      selectedEvent.status === 'approved' ? 'bg-success-100 text-success-700' :
                      selectedEvent.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                      selectedEvent.status === 'error' ? 'bg-error-100 text-error-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Tipo:</span>
                    <span className="ml-2 text-neutral-900 capitalize">{selectedEvent.type}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Plataformas:</span>
                    <div className="ml-2 flex gap-1 mt-1">
                      {selectedEvent.platform?.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </Button>
              <Button variant="outline">
                Editar
              </Button>
              <Button>
                Publicar Ahora
              </Button>
            </div>
          </div>
        )}

        {/* Status Progress */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-8">
          <StatusProgress 
            statuses={events.map(e => e.status)}
            className="max-w-md"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-2xl font-bold text-neutral-900">
              {events.filter(e => e.status === 'published').length}
            </div>
            <div className="text-sm text-neutral-600">Publicados</div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-2xl font-bold text-success-600">
              {events.filter(e => e.status === 'approved').length}
            </div>
            <div className="text-sm text-neutral-600">Aprobados</div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-2xl font-bold text-warning-600">
              {events.filter(e => e.status === 'pending').length}
            </div>
            <div className="text-sm text-neutral-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="text-2xl font-bold text-neutral-600">
              {events.filter(e => e.status === 'draft').length}
            </div>
            <div className="text-sm text-neutral-600">Borradores</div>
          </div>
        </div>
      </div>
    </div>
  )
}