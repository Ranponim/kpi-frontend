/**
 * Preferences 페이지
 * 데이터베이스 연동 설정
 */

import { useState, useEffect } from 'react';
import { Header } from '../components/layout/index.js';
import { Card, Button, Input, Spinner } from '../components/common/index.js';

const DEFAULT_DB_CONFIG = {
  host: '165.213.69.30',
  port: '5442',
  database: 'pvt_db',
  user: 'testuser',
  password: '1234qwer',
  table_name: 'pvt_db',
};

function DatabaseConfigForm({ config, onChange, onSave, onTest, saving, testing, testResult }) {
  const handleChange = (field) => (e) => {
    onChange({ ...config, [field]: e.target.value });
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
          <span className="material-symbols-outlined text-blue-400">database</span>
        </div>
        <div>
          <h2 className="text-white text-lg font-bold">Database 연동</h2>
          <p className="text-slate-400 text-sm">PostgreSQL 데이터베이스 연결 설정</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Host & Port */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-slate-300 text-sm font-medium mb-2">Host</label>
            <Input
              icon="dns"
              placeholder="데이터베이스 호스트 주소"
              value={config.host}
              onChange={handleChange('host')}
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Port</label>
            <Input
              icon="tag"
              placeholder="포트 번호"
              value={config.port}
              onChange={handleChange('port')}
            />
          </div>
        </div>

        {/* Database & Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Database</label>
            <Input
              icon="storage"
              placeholder="데이터베이스 이름"
              value={config.database}
              onChange={handleChange('database')}
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Table Name</label>
            <Input
              icon="table_chart"
              placeholder="테이블 이름"
              value={config.table_name}
              onChange={handleChange('table_name')}
            />
          </div>
        </div>

        {/* User & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">User</label>
            <Input
              icon="person"
              placeholder="사용자 이름"
              value={config.user}
              onChange={handleChange('user')}
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <Input
              icon="lock"
              type="password"
              placeholder="비밀번호"
              value={config.password}
              onChange={handleChange('password')}
            />
          </div>
        </div>

        {/* Connection String Preview */}
        <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-200/10">
          <p className="text-slate-400 text-xs font-medium mb-2">Connection String Preview</p>
          <code className="text-sm text-green-400 break-all">
            postgresql://{config.user}:****@{config.host}:{config.port}/{config.database}
          </code>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${
                testResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {testResult.success ? 'check_circle' : 'error'}
              </span>
              <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/10">
          <Button 
            variant="secondary" 
            icon="cable" 
            onClick={onTest}
            loading={testing}
            disabled={saving}
          >
            연결 테스트
          </Button>
          <Button 
            icon="save" 
            onClick={onSave}
            loading={saving}
            disabled={testing}
          >
            설정 저장
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Preferences() {
  const [dbConfig, setDbConfig] = useState(DEFAULT_DB_CONFIG);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  // 저장된 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem('db_config');
    if (saved) {
      try {
        setDbConfig({ ...DEFAULT_DB_CONFIG, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('db_config', JSON.stringify(dbConfig));
      
      // TODO: 백엔드 API로 저장 (구현 시 추가)
      // await saveUserPreferences('default', { db_config: dbConfig });
      
      setSaveMessage({ success: true, message: '설정이 저장되었습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ success: false, message: '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // 백엔드 연결 테스트 API 호출
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://165.213.69.30:8000/api'}/db/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConfig),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setTestResult({ 
        success: data.connected ?? true, 
        message: data.message || `${dbConfig.host}:${dbConfig.port}/${dbConfig.database} 연결 성공!` 
      });
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: err.message || '연결 테스트에 실패했습니다. 백엔드 API를 확인하세요.' 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Header 
        title="Preferences" 
        description="시스템 설정 및 데이터베이스 연결을 관리합니다." 
      />

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg border ${
          saveMessage.success 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">
              {saveMessage.success ? 'check_circle' : 'error'}
            </span>
            {saveMessage.message}
          </div>
        </div>
      )}

      <DatabaseConfigForm
        config={dbConfig}
        onChange={setDbConfig}
        onSave={handleSave}
        onTest={handleTest}
        saving={saving}
        testing={testing}
        testResult={testResult}
      />

      {/* 추가 설정 섹션 (나중에 확장 가능) */}
      <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-slate-200/20 bg-[#111a22]/50">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <span className="material-symbols-outlined text-4xl text-slate-500 mb-3">settings</span>
          <p className="text-slate-400 text-sm">추가 설정 옵션이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}
