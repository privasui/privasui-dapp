import { Button } from '@radix-ui/themes';
import { useFilePicker } from '@/widgets/chat/model/use-file-picker';

export const FileUploader = () => {
  const { trigger, fileBytes, previewUrl, fileInput } = useFilePicker();

  return (
    <div className="space-y-4">
      {fileInput}

      <Button onClick={trigger}>
        📎 Attach File
      </Button>

      {fileBytes && (
        <div>
          <p>✅ File loaded: {fileBytes.length} bytes</p>
          {previewUrl && <img src={previewUrl} alt="Preview" className="max-w-xs rounded" />}
        </div>
      )}
    </div>
  );
};
