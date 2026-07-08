'use client';

import { useState } from 'react';

export default function DashboardMainTabs({ arenaContent, statsContent }) {
  const [activeTab, setActiveTab] = useState('arena');

  return (
    <div className="db-tabs-container" style={{ marginTop: '16px' }}>
      <div className="db-tabs-header">
        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'arena' ? 'active' : ''}`}
          onClick={() => setActiveTab('arena')}
        >
          Match Arena &amp; Brackets
        </button>
        <button
          type="button"
          className={`db-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Tournament Statistics
        </button>
      </div>

      <div className="db-tabs-content">
        {activeTab === 'arena' && arenaContent}
        {activeTab === 'stats' && statsContent}
      </div>
    </div>
  );
}
