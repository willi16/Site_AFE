import { User, Mail } from 'lucide-react';

function MemberCard({ member }) {
  return (
    <div className="card text-center p-6">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-surface-100">
        {member.photo ? (
          <img src={member.photo} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-500">
            <User className="w-10 h-10 text-white" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-surface-900 mb-1">{member.full_name}</h3>
      <p className="text-sm text-accent-500 font-medium mb-2 capitalize">{member.role || 'Membre'}</p>
      {member.bio && <p className="text-sm text-surface-500 line-clamp-3">{member.bio}</p>}
    </div>
  );
}

export default MemberCard;
