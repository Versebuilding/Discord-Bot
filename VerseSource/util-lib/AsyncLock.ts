import { AwaitForSeconds } from "./util";

export class CustomLock
{
	private static TempLocks = new Map<string, CustomLock>();

	constructor(resources: number = 1)
	{
		this.resources = resources;
		this.queue = [];
	}

	resources: number;
	queue: (() => any)[];
	private temp: boolean = false;

	tryAquire(): boolean
	{
		if (this.resources > 0)
		{
			this.resources--;
			return true;
		}
		else return false;
	}

	asyncAquire(): Promise<void>
	{
		return new Promise(resolve => {
			if (this.tryAquire())
				resolve();
			else
				this.queue.push(resolve);
		});
	}

	release(count: number = 1)
	{
		let rs = this.resources + count;

		while (this.queue.length > 0 && rs > 0)
		{
			let x = this.queue.shift();
			if (x) x();

			rs--;
		}

		this.resources = rs;
	}

	static TryAcquireKey(key: string): boolean
	{
		var lock = CustomLock.TempLocks.get(key);
		if (!lock) lock = new CustomLock(1);

		return lock.tryAquire(); 
	}

	static HasKey(key: string): boolean
	{
		const lock = CustomLock.TempLocks.get(key);
		if (!lock || lock.resources > 0)
			return true;
		return false;
	}

	static AsyncAquireKey(key: string): Promise<void>
	{
		var lock = CustomLock.TempLocks.get(key);
		if (!lock) lock = new CustomLock(1);

		return lock.asyncAquire(); 
	}

	static ReleaseKey(key: string): boolean
	{
		var lock = CustomLock.TempLocks.get(key);
		if (lock)
		{
			lock.release();
			if (lock.resources > 0)
				CustomLock.TempLocks.delete(key);
			return true;
		}
		else return false;
	}

	static async WaitToHoldKey<T>(key: string, callback: () => Promise<T>, timeout: number = 5000): Promise<T>
	{
		await AwaitForSeconds(CustomLock.AsyncAquireKey(key));
		const result = await callback();
		CustomLock.ReleaseKey(key);
		return result;
	}

	static async TryHoldKey<T>(key: string, callback: () => Promise<T>, timeout: number = 5000): Promise<T>
	{
		if (!CustomLock.TryAcquireKey(key))
			throw new Error("Could not get key!");
	
		const result = await callback();
		CustomLock.ReleaseKey(key);
		return result;
	}
}