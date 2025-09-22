// components/character-creator/CharacterInfoPanel.tsx

import React from 'react';
import { CharacterInfo } from '../../pages/character/create';

interface CharacterInfoPanelProps {
  info: CharacterInfo;
  onInfoChange: (fieldName: keyof CharacterInfo, value: string) => void;
}

/**
 * 角色叙事信息面板 (v0.1.1)
 * @description 提供了角色的核心叙事信息输入区域，新增了外观和阵营字段。
 */
const CharacterInfoPanel: React.FC<CharacterInfoPanelProps> = ({ info, onInfoChange }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

      {/* 新增：外观 */}
      <div>
        <label htmlFor="appearance" className="input-label">外观描述</label>
        <textarea
          id="appearance"
          name="appearance"
          value={info.appearance}
          onChange={handleInputChange}
          rows={4}
          placeholder="描述她的魔法少女形态，包括服装、配饰、主色调和整体风格。"
          className="input-field"
        />
      </div>
      
      {/* 新增：阵营 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="faction" className="input-label">阵营所属</label>
            <select
                id="faction"
                name="faction"
                value={info.faction}
                onChange={handleInputChange}
                className="input-field"
            >
                <option value="">未定/无</option>
                <option value="魔法国度">魔法国度</option>
                <option value="爪痕">爪痕</option>
                <option value="黑烬黎明">黑烬黎明</option>
                <option value="其他">其他...</option>
            </select>
        </div>
        {info.faction === '其他' && (
            <div>
                <label htmlFor="customFaction" className="input-label">自定义阵营名称</label>
                <input
                    type="text"
                    id="customFaction"
                    name="customFaction"
                    value={info.customFaction || ''}
                    onChange={handleInputChange}
                    placeholder="请输入自定义阵营"
                    className="input-field"
                />
            </div>
        )}
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