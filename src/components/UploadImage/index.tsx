import { App, Upload, type UploadProps } from 'antd';
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  useState,
} from 'react';

export type UploadImageProps = Omit<
  UploadProps,
  'action' | 'children' | 'customRequest' | 'showUploadList'
> & {
  trigger: ReactElement;
  onUpload: (file: File) => Promise<void>;
  maxSize?: number;
};

const DEFAULT_ACCEPT = '.jpg,.jpeg,.png,.webp';
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

const UploadImage = ({
  trigger,
  onUpload,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  disabled,
  beforeUpload,
  onChange,
  ...uploadProps
}: UploadImageProps) => {
  const [uploading, setUploading] = useState(false);
  const { message } = App.useApp();

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onError, onSuccess } = options;

    try {
      if (!(file instanceof File)) {
        throw new Error('无法读取所选图片');
      }
      if (!file.type.startsWith('image/')) {
        throw new Error('请选择图片文件');
      }
      if (file.size > maxSize) {
        throw new Error(
          `图片大小不能超过 ${Math.floor(maxSize / 1024 / 1024)}MB`,
        );
      }

      setUploading(true);
      await onUpload(file);
      onSuccess?.({}, new XMLHttpRequest());
    } catch (error) {
      const uploadError =
        error instanceof Error ? error : new Error('图片上传失败');
      onError?.(uploadError);
      message.error(uploadError.message || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const renderedTrigger = isValidElement(trigger)
    ? cloneElement(
        trigger as ReactElement<{ disabled?: boolean; loading?: boolean }>,
        {
          disabled: disabled || uploading,
          loading: uploading,
        },
      )
    : trigger;

  return (
    <Upload
      {...uploadProps}
      accept={accept}
      disabled={disabled || uploading}
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={onChange}
      customRequest={customRequest}
    >
      {renderedTrigger}
    </Upload>
  );
};

export default UploadImage;
