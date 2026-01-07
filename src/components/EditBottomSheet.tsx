import { useState, useEffect, useCallback } from 'react';

// 폰트 리스트 (원본 프로젝트에서 가져옴)
const FONT_LIST = [
  { id: 'default', name: '기본', fontFamily: 'Pretendard, sans-serif' },
  { id: 'nanum-myeongjo', name: '나눔\n명조', fontFamily: "'NanumMyeongjo', serif", isBest: true },
  { id: 'nanum-gothic', name: '나눔\n고딕', fontFamily: "'NanumGothic', sans-serif" },
  { id: 'gowun-batang', name: '고운\n바탕', fontFamily: "'Gowun Batang', serif" },
  { id: 'noto-serif', name: '노토\n세리프', fontFamily: "'Noto Serif KR', serif" },
];

// 색상 리스트
const COLOR_LIST = [
  '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#674206', '#8B4513', '#A0522D', '#CD853F', '#DEB887',
  '#800000', '#A52A2A', '#B22222', '#CD5C5C', '#E9967A',
  '#000080', '#0000CD', '#4169E1', '#6495ED', '#87CEEB',
  '#006400', '#228B22', '#32CD32', '#90EE90', '#98FB98',
];

type EditTab = 'font' | 'colorSize' | 'spacing';

interface ComponentStyle {
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  textAlign?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
}

interface Component {
  id: string;
  type: string;
  content: string;
  style: ComponentStyle;
}

interface EditBottomSheetProps {
  isOpen: boolean;
  component: Component;
  onClose: () => void;
  onTextEditClick: () => void;
  onStyleChange: (newStyle: ComponentStyle) => void;
}

export default function EditBottomSheet({
  isOpen,
  component,
  onClose,
  onTextEditClick,
  onStyleChange,
}: EditBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('font');

  // 현재 스타일 상태
  const [selectedFontId, setSelectedFontId] = useState('nanum-myeongjo');
  const [selectedColor, setSelectedColor] = useState(component.style.color || '#333333');
  const [fontSize, setFontSize] = useState(
    parseInt(component.style.fontSize?.replace('px', '') || '16')
  );
  const [letterSpacing, setLetterSpacing] = useState(25); // 기본 25 (0px)
  const [lineHeight, setLineHeight] = useState(
    Math.round(parseFloat(component.style.lineHeight || '1.6') * 100)
  );

  // 컴포넌트 변경 시 스타일 동기화
  useEffect(() => {
    setSelectedColor(component.style.color || '#333333');
    setFontSize(parseInt(component.style.fontSize?.replace('px', '') || '16'));
    setLineHeight(Math.round(parseFloat(component.style.lineHeight || '1.6') * 100));
  }, [component]);

  // 폰트 변경
  const handleFontClick = useCallback((fontId: string) => {
    setSelectedFontId(fontId);
    const font = FONT_LIST.find(f => f.id === fontId);
    if (font) {
      onStyleChange({ fontFamily: font.fontFamily });
    }
  }, [onStyleChange]);

  // 색상 변경
  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    onStyleChange({ color });
  }, [onStyleChange]);

  // 폰트 크기 변경
  const handleFontSizeChange = useCallback((size: number) => {
    setFontSize(size);
    onStyleChange({ fontSize: `${size}px` });
  }, [onStyleChange]);

  // 글자 간격 변경
  const handleLetterSpacingChange = useCallback((spacing: number) => {
    setLetterSpacing(spacing);
    const px = (spacing - 25) / 10; // slider 25 = 0px
    onStyleChange({ letterSpacing: `${px}px` });
  }, [onStyleChange]);

  // 줄 간격 변경
  const handleLineHeightChange = useCallback((height: number) => {
    setLineHeight(height);
    onStyleChange({ lineHeight: `${height / 100}` });
  }, [onStyleChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* 상단 네비게이션 헤더 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'rgba(23, 23, 23, 0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          zIndex: 41,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 12px 20px',
          }}
        >
          {/* 뒤로가기 버튼 */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* 타이틀 */}
          <p
            style={{
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'Pretendard, -apple-system, sans-serif',
              color: '#ffffff',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            텍스트 편집
          </p>

          {/* 오른쪽 빈 공간 */}
          <div style={{ width: '24px' }} />
        </div>

        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        />
      </div>

      {/* 하단 바텀시트 */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '100%',
          backgroundColor: 'rgba(23, 23, 23, 0.97)',
          zIndex: 40,
        }}
      >
        {/* 탭 메뉴 */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '16px 20px 8px 20px',
            width: '100%',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('font')}
            style={{
              backgroundColor: activeTab === 'font' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '300px',
              padding: '6px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: activeTab === 'font' ? '#333333' : '#f4f4f5',
                margin: 0,
              }}
            >
              폰트
            </p>
          </button>

          <button
            onClick={onTextEditClick}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '300px',
              padding: '6px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#f4f4f5',
                margin: 0,
              }}
            >
              텍스트수정
            </p>
          </button>

          <button
            onClick={() => setActiveTab('colorSize')}
            style={{
              backgroundColor: activeTab === 'colorSize' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '300px',
              padding: '6px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: activeTab === 'colorSize' ? '#333333' : '#f4f4f5',
                margin: 0,
              }}
            >
              색상/크기
            </p>
          </button>

          <button
            onClick={() => setActiveTab('spacing')}
            style={{
              backgroundColor: activeTab === 'spacing' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '300px',
              padding: '6px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: activeTab === 'spacing' ? '#333333' : '#f4f4f5',
                margin: 0,
              }}
            >
              간격
            </p>
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div style={{ padding: '0 20px', minHeight: '61px' }}>
          {/* 폰트 탭 */}
          {activeTab === 'font' && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                overflowX: 'auto',
              }}
            >
              {FONT_LIST.map((font) => {
                const isSelected = selectedFontId === font.id;
                return (
                  <div
                    key={font.id}
                    onClick={() => handleFontClick(font.id)}
                    style={{
                      position: 'relative',
                      flexShrink: 0,
                      width: '61px',
                      height: '61px',
                      backgroundColor: '#333333',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #60c0ba' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 4px',
                      cursor: 'pointer',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 400,
                        fontFamily: font.fontFamily,
                        color: '#f4f4f5',
                        margin: 0,
                        textAlign: 'center',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {font.name}
                    </p>
                    {font.isBest && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'linear-gradient(to bottom, #ffc443, #e18700)',
                          borderTopLeftRadius: '2px',
                          borderBottomLeftRadius: '2px',
                          borderTopRightRadius: '8px',
                          padding: '2px 4px 2px 3px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#ffffff',
                            margin: 0,
                          }}
                        >
                          BEST
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 색상/크기 탭 */}
          {activeTab === 'colorSize' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '8px 0',
              }}
            >
              {/* 글씨 색상 */}
              <div style={{ display: 'flex', gap: '27px', alignItems: 'center' }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                    color: '#f4f4f5',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  글씨 색상
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '2px',
                    alignItems: 'center',
                    overflowX: 'auto',
                    flex: 1,
                  }}
                >
                  {COLOR_LIST.map((color, index) => (
                    <div
                      key={index}
                      onClick={() => handleColorChange(color)}
                      style={{
                        flexShrink: 0,
                        width: '32px',
                        height: '32px',
                        backgroundColor: color,
                        borderRadius: '4px',
                        border:
                          selectedColor === color
                            ? '2px solid #60c0ba'
                            : color === '#FFFFFF'
                              ? '1px solid #333333'
                              : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 글씨 크기 */}
              <div style={{ display: 'flex', gap: '27px', alignItems: 'center' }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                    color: '#f4f4f5',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  글씨 크기
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right, #60c0ba 0%, #60c0ba ${((fontSize - 10) / 40) * 100}%, #666666 ${((fontSize - 10) / 40) * 100}%, #666666 100%)`,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'Pretendard, -apple-system, sans-serif',
                      color: '#f4f4f5',
                      margin: 0,
                      width: '23px',
                      textAlign: 'right',
                    }}
                  >
                    {fontSize}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 간격 탭 */}
          {activeTab === 'spacing' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '8px 0',
              }}
            >
              {/* 글자 간격 */}
              <div style={{ display: 'flex', gap: '27px', alignItems: 'center' }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                    color: '#f4f4f5',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  글자 간격
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={letterSpacing}
                    onChange={(e) => handleLetterSpacingChange(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right, #60c0ba 0%, #60c0ba ${(letterSpacing / 50) * 100}%, #666666 ${(letterSpacing / 50) * 100}%, #666666 100%)`,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'Pretendard, -apple-system, sans-serif',
                      color: '#f4f4f5',
                      margin: 0,
                      width: '23px',
                      textAlign: 'right',
                    }}
                  >
                    {letterSpacing}
                  </p>
                </div>
              </div>

              {/* 줄 간격 */}
              <div style={{ display: 'flex', gap: '39px', alignItems: 'center' }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                    color: '#f4f4f5',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  줄 간격
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    value={lineHeight}
                    onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right, #60c0ba 0%, #60c0ba ${((lineHeight - 80) / 120) * 100}%, #666666 ${((lineHeight - 80) / 120) * 100}%, #666666 100%)`,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'Pretendard, -apple-system, sans-serif',
                      color: '#f4f4f5',
                      margin: 0,
                      width: '23px',
                      textAlign: 'right',
                    }}
                  >
                    {lineHeight}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px 8px',
          }}
        >
          {/* 초기화 버튼 */}
          <button
            onClick={() => {
              // 초기값으로 리셋
              setSelectedColor(component.style.color || '#333333');
              setFontSize(parseInt(component.style.fontSize?.replace('px', '') || '16'));
              setLetterSpacing(25);
              setLineHeight(Math.round(parseFloat(component.style.lineHeight || '1.6') * 100));
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8C2 4.686 4.686 2 8 2C11.314 2 14 4.686 14 8C14 11.314 11.314 14 8 14"
                stroke="#ebebeb"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M4 14L2 12L4 10"
                stroke="#ebebeb"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 400,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#ebebeb',
                margin: 0,
              }}
            >
              초기화
            </p>
          </button>

          {/* 완료 버튼 */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 24px',
              cursor: 'pointer',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                color: '#60c0ba',
                margin: 0,
              }}
            >
              완료
            </p>
          </button>
        </div>
      </div>

      {/* 슬라이더 스타일 */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #60c0ba;
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #60c0ba;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
}
