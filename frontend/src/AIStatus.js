import React, { useEffect, useState } from 'react';

function AIStatus() {
  const [aiOnline, setAiOnline] = useState(false);

  useEffect(() => {
    fetch('/api/ai/status')
      .then(response => response.json())
      .then(data => {
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
