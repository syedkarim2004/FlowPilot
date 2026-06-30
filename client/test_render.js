import React from 'react';
import { renderToString } from 'react-dom/server';

function getTimeOfDay() { return 'morning'; }
const user = { displayName: 'Syed' };
const activeTasks = [1, 2, 3];

function Header() {
  return React.createElement('div', { className: 'w-full flex flex-col gap-1 pb-2' },
    React.createElement('h1', { className: 'text-[22px] font-bold text-[#FAFAFA] m-0 p-0 flex items-center gap-2' },
      React.createElement('span', null, `Good ${getTimeOfDay()}, ${user?.displayName?.split(' ')[0] || 'User'}`),
      React.createElement('span', null, '👋')
    ),
    React.createElement('p', { className: 'text-[13px] text-[#A1A1AA] m-0 p-0' },
      `${activeTasks.length} tasks need your attention`
    )
  );
}

console.log(renderToString(React.createElement(Header)));
