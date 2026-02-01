import React from 'react';
import { Phone, Circle } from 'lucide-react';
import { User } from '../hooks/useLANChat';

interface UserListProps {
  users: User[];
  currentUserId: number | null;
  onCallUser: (user: User) => void;
}

const statusColors = {
  online: '#43b581',
  away: '#faa61a',
  busy: '#f04747',
  offline: '#747f8d'
};

export function UserList({ users, currentUserId, onCallUser }: UserListProps) {
  const onlineUsers = users.filter(u => u.status !== 'offline');

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-[#202225] shadow">
        <h2 className="font-semibold text-white">LAN Chat</h2>
      </div>

      {/* Canales */}
      <div className="p-2">
        <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide mb-2 px-2">
          Canal General
        </div>
        <div className="flex items-center px-2 py-1.5 rounded bg-[#393c43] text-white">
          <span className="text-[#8e9297] mr-2">#</span>
          general
        </div>
      </div>

      {/* Separador */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-xs font-semibold text-[#8e9297] uppercase tracking-wide mb-2 px-4 mt-4">
          En linea - {onlineUsers.length}
        </div>

        {/* Lista de usuarios */}
        <div className="px-2 space-y-0.5">
          {users.map(user => (
            <div
              key={user.id}
              className={`flex items-center px-2 py-1.5 rounded hover:bg-[#393c43] group ${
                user.id === currentUserId ? 'bg-[#393c43]' : ''
              }`}
            >
              {/* Avatar con estado */}
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <Circle
                  size={12}
                  fill={statusColors[user.status]}
                  color="#2f3136"
                  strokeWidth={3}
                  className="absolute -bottom-0.5 -right-0.5"
                />
              </div>

              {/* Nombre */}
              <span className={`flex-1 text-sm ${
                user.id === currentUserId ? 'text-white font-medium' : 'text-[#8e9297]'
              }`}>
                {user.username}
                {user.id === currentUserId && ' (tu)'}
              </span>

              {/* Boton de llamar */}
              {user.id !== currentUserId && (
                <button
                  onClick={() => onCallUser(user)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-[#4f545c] text-[#b9bbbe] hover:text-white transition-opacity"
                  title={`Llamar a ${user.username}`}
                >
                  <Phone size={16} />
                </button>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center text-[#8e9297] text-sm py-4">
              No hay usuarios conectados
            </div>
          )}
        </div>
      </div>

      {/* Usuario actual */}
      <div className="h-[52px] bg-[#292b2f] px-2 flex items-center">
        <div className="relative mr-2">
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm">
            {users.find(u => u.id === currentUserId)?.username.charAt(0).toUpperCase() || '?'}
          </div>
          <Circle
            size={12}
            fill={statusColors.online}
            color="#292b2f"
            strokeWidth={3}
            className="absolute -bottom-0.5 -right-0.5"
          />
        </div>
        <div className="flex-1">
          <div className="text-white text-sm font-medium truncate">
            {users.find(u => u.id === currentUserId)?.username || 'Conectando...'}
          </div>
          <div className="text-[#b9bbbe] text-xs">En linea</div>
        </div>
      </div>
    </div>
  );
}
