/**
 * @module ProfileFieldsGrid
 * Grid of profile detail fields (personality, relationship, etc.)
 */
import { ProfileField } from "./ProfileField";
import {
  type EditableProfileData,
  personalityOptions, relationshipOptions, occupationOptions,
  hairColorOptions, bodyTypeOptions, clothingOptions, likesOptions,
  eatsOptions, listensToOptions, prefersOptions, interestsOptions,
} from "./profile-constants";

interface ProfileFieldsGridProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
}

export function ProfileFieldsGrid({ displayData, editData, setEditData, isEditing }: ProfileFieldsGridProps) {
  const set = (key: keyof EditableProfileData) => (v: string) =>
    setEditData((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs sm:text-sm border-t border-border/30 pt-3">
      <ProfileField label="Personlighet" value={displayData.personality} editValue={editData.personality} isEditing={isEditing} options={personalityOptions} onChange={set("personality")} />
      <ProfileField label="Civilstånd" value={displayData.relationship} editValue={editData.relationship} isEditing={isEditing} options={relationshipOptions} onChange={set("relationship")} />
      <ProfileField label="Sysselsättning" value={displayData.occupation} editValue={editData.occupation} isEditing={isEditing} options={occupationOptions} onChange={set("occupation")} />
      <ProfileField label="Föredrar" value={displayData.prefers} editValue={editData.prefers} isEditing={isEditing} options={prefersOptions} multiSelect onChange={set("prefers")} />
      <ProfileField label="Gillar" value={displayData.likes} editValue={editData.likes} isEditing={isEditing} isText onChange={set("likes")} />
      <ProfileField label="Lyssnar på" value={displayData.listens_to} editValue={editData.listens_to} isEditing={isEditing} options={listensToOptions} multiSelect onChange={set("listens_to")} />
      <ProfileField label="Äter helst" value={displayData.eats} editValue={editData.eats} isEditing={isEditing} options={eatsOptions} multiSelect onChange={set("eats")} />
      <ProfileField label="Hårfärg" value={displayData.hair_color} editValue={editData.hair_color} isEditing={isEditing} options={hairColorOptions} onChange={set("hair_color")} />
      <ProfileField label="Intressen" value={displayData.interests} editValue={editData.interests} isEditing={isEditing} options={interestsOptions} multiSelect onChange={set("interests")} />
      <ProfileField label="Kläder" value={displayData.clothing} editValue={editData.clothing} isEditing={isEditing} options={clothingOptions} multiSelect onChange={set("clothing")} />
      <ProfileField label="Kropp" value={displayData.body_type} editValue={editData.body_type} isEditing={isEditing} options={bodyTypeOptions} onChange={set("body_type")} />
    </div>
  );
}
