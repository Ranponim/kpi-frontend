/**
 * Preferences 페이지 (플레이스홀더)
 */

import { Header } from '../components/layout';
import { Card, EmptyState } from '../components/common';

export default function Preferences() {
  return (
    <div className="max-w-4xl">
      <Header title="Preferences" description="사용자 설정 및 환경 구성을 관리합니다." />
      <Card>
        <EmptyState icon="settings" title="Preferences (준비 중)" description="이 페이지는 아직 개발 중입니다. 곧 사용자 설정 기능이 추가될 예정입니다." />
      </Card>
    </div>
  );
}



