'use client';

import { useState } from 'react';

export default function DashboardStatsTabs({ playersList, teamsList, heroesList, rolesList }) {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div className="db-tabs-container">
      <div className="db-tabs-header">
        <button
          className={`db-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          Player Rankings
        </button>
        <button
          className={`db-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Rankings
        </button>
        <button
          className={`db-tab-btn ${activeTab === 'heroes' ? 'active' : ''}`}
          onClick={() => setActiveTab('heroes')}
        >
          Hero Stats & Roles
        </button>
      </div>

      <div className="db-tabs-content">
        {activeTab === 'players' && playersList}
        {activeTab === 'teams' && teamsList}
        {activeTab === 'heroes' && (
          <div className="db-flex-col-gap-10">
            {heroesList}
            {rolesList}
          </div>
        )}
      </div>
    </div>
  );
}
