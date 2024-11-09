import React from "react";

function QuizCard({ title, date }) {
  return (
    <div className="w-60 h-40 min-w-60 hover:bg-gray-800 transition-all duration-300 bg-grey-6 mx-2 rounded-xl flex flex-col overflow-hidden justify-between pb-2">
      <img
        src="https://st4.depositphotos.com/2572561/31066/i/450/depositphotos_310665768-stock-photo-over-the-shoulder-shot-of.jpg"
        className="h-1/3 w-full object-cover"
      />
      <h3 className="mx-4 text-sm text-base-1">{title}</h3>
      <div className="flex items-center justify-between">
        <p className="mx-4 text-xs text-grey-1 w-full text-left">{date}</p>
        <p className="mx-4 text-white text-xs bg-blue-500 px-2 py-1 rounded-2xl text-nowrap cursor-pointer hover:bg-blue-800 transition-all duration-300">
          Take Quiz
        </p>
      </div>
    </div>
  );
}

export default QuizCard;
