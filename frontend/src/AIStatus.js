import React, { useEffect, useState } from 'react';
import { aiAPI } from './services/api';

function AIStatus() {
  const [aiOnline, setAiOnline] = useState(false);

  useEffect(() => {
    aiAPI.getStatus()
      .then(response => {
        const data = response.data;
        if (data.features && data.features.semanticSearch === true) {
          setAiOnline(true);
        } else {
          setAiOnline(false);
        }
      })
      .catch(error => {
        setAiOnline(false);
        console.error('AI status fetch error:', error);
      });
  }, []);

  return (
    <div style={{margin: '10px 0'}}>
      {aiOnline
        ? <span style={{color: "green", fontWeight:"bold"}}>AI Service is Online ✅</span>
        : <span style={{color: "red", fontWeight:"bold"}}>AI Service is down ❌</span>
      }
    </div>
  );
}

export default AIStatus;
