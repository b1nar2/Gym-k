import React,{ useRef, useState }  from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // 월
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid'; // 주
import './CmsCalendar.css';

export function CmsCalendar() {

  const calendarRef = useRef<FullCalendar>(null);
  const [dateInput, setDateInput] = useState('');

  // today 버튼에 핸들러 달기(뷰 강제 전환)
  const handleTodayClick = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView('timeGridWeek');
      api.today();
    }
  };

  // 사용자 입력으로 날짜 이동
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInput(e.target.value);
  };

  const goToDate = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && dateInput) {
    calendarApi.changeView('timeGridDay'); // (주간별 보기)뷰 변경
    calendarApi.gotoDate(dateInput);        // 날짜 이동
    }
  };


  return (
    <div>
      <h1>캘린더</h1>
        <input className='date-change-button'
          style={{ marginLeft: '20px' }}
          type="date"
          value={dateInput}
          onChange={handleDateChange}
          placeholder="날짜 선택"
        />
        <button onClick={goToDate} style={{fontSize: '14px', padding:'10px'}}>
          이동
        </button>
      <FullCalendar
        ref={calendarRef}
        plugins={[interactionPlugin,timeGridPlugin,dayGridPlugin]}
        locale="ko" // 한국어 설정
        initialView="timeGridWeek" // 뷰 이름을 받아 해당 레이아웃을 첫 화면으로 렌더링
        fixedWeekCount={false} // 웝별 보기에 표시되는 주 수. true = 항상 6주, false = 월에 따라 4~6주로 구성
        showNonCurrentDates={true}// 월별 보기에서는 이전 달이나 다음 달의 날짜를 렌더링할지 여부를 지정. 
        slotMinTime="08:00:00"         // 시작시간 10시 고정
        slotMaxTime="22:00:00"         // 종료시간 22시 고정
        slotDuration="00:30:00"        // 30분 단위 슬롯 유지
        slotLabelInterval="01:00:00"   // 시간 라벨은 1시간 간격으로 표시
        height="auto"                  // 캘린더 높이를 내용에 맞게 자동조절
        allDaySlot={false} // all-day슬롯 숨기기
        
        headerToolbar={{
            start: 'prev',
            center: 'title',
            end: 'next customToday timeGridWeek dayGridMonth' 
            }}
        customButtons={{
            customToday: {
                text: 'Today',
                click: handleTodayClick
                    }
            }}    
            selectable= {true}
            droppable= {true}
            navLinks= {true}
            editable= {true}
            nowIndicator= {true}
        // dateClick={(arg) => alert(arg.dateStr)}
      />
    </div>
  );
}