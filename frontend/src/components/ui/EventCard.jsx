import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

function EventCard({ event }) {
  return (
    <Link to={`/evenements/${event.id}`} className="card group">
      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
        {event.images?.[0]?.image ? (
          <img src={event.images[0].image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.status === 'upcoming' ? 'bg-accent-500 text-white' : 'bg-surface-700 text-white'}`}>
            {event.status === 'upcoming' ? 'À venir' : 'Passé'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-500 transition-colors mb-2 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-surface-500 mb-3 line-clamp-2">{event.short_description || event.description}</p>
        <div className="flex items-center gap-4 text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(event.event_date)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default EventCard;
