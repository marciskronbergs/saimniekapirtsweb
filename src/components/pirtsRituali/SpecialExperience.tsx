import { useTranslation } from 'react-i18next';
import SpecialPackagesSection from '../SpecialPackagesSection';

// "Īpašie Pirts Piedzīvojumi": the homepage's two photo cards (Vecmeitu
// Pirts, Vīru Paka) with their glass panels, under this page's own heading.

const SpecialExperience = () => {
  const { t } = useTranslation('rituali');
  return <SpecialPackagesSection heading={{ title: t('specialExperiences.title') }} />;
};

export default SpecialExperience;
