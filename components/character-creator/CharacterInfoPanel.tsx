// components/character-creator/CharacterInfoPanel.tsx

import React from 'react';
import { CharacterInfo } from '../../pages/character/create';

interface CharacterInfoPanelProps {
  info: CharacterInfo;
  onInfoChange: (fieldName: keyof CharacterInfo, value: string) => void;
}

/**
 * 角色叙事信息面板
 * @description 提供文本输入区域，用于填写角色的背景、信念等信息。
 */
const CharacterInfoPanel: React.FC<CharacterInfoPanelProps> = ({ info, onInfoChange }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onInfoChange(e.target.name as keyof CharacterInfo, e.target.value);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2">角色信息</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 真名与代号 */}
        <div>
          <label htmlFor="realName" className="input-label">真名</label>
          <input
            type="text"
            id="realName"
            name="realName"
            value={info.realName}
            onChange={handleInputChange}
            placeholder="她在成为魔法少女前的名字"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="codename" className="input-label">代号</label>
          <input
            type="text"
            id="codename"
            name="codename"
            value={info.codename}
            onChange={handleInputChange}
            placeholder="她作为魔法少女的代号"
            className="input-field"
          />
        </div>
      </div>
      
      {/* 信念 */}
      <div>
        <label htmlFor="belief" className="input-label">信念与愿望</label>
        <textarea
          id="belief"
          name="belief"
          value={info.belief}
          onChange={handleInputChange}
          rows={3}
          placeholder="她为何而战？是什么样的愿望让她成为了魔法少女？"
          className="input-field"
        />
      </div>

      {/* 羁绊 */}
      <div>
        <label htmlFor="bonds" className="input-label">羁绊 (Kizuna)</label>
        <textarea
          id="bonds"
          name="bonds"
          value={info.bonds}
          onChange={handleInputChange}
          rows={3}
          placeholder="对她最重要的人或事物是什么？可以是亲人、朋友、宿敌，或某个执念。"
          className="input-field"
        />
      </div>
      
      {/* 背景故事 */}
      <div>
        <label htmlFor="background" className="input-label">背景故事</label>
        <textarea
          id="background"
          name="background"
          value={info.background}
          onChange={handleInputChange}
          rows={5}
          placeholder="简单描述她的过去，她背负着怎样的故事？"
          className="input-field"
        />
      </div>
    </div>
  );
};

export default CharacterInfoPanel;